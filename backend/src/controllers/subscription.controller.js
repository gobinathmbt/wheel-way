
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscriptions');
const Company = require('../models/Company');
const { logEvent } = require('./logs.controller');

// Get pricing configuration
const getPricingConfig = async (req, res) => {
  try {
    const plan = await Plan.findOne({ is_active: true });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active pricing plan found'
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get pricing config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pricing configuration'
    });
  }
};

// Calculate subscription price
const calculatePrice = async (req, res) => {
  try {
    const { number_of_days, number_of_users, selected_modules } = req.body;

    const plan = await Plan.findOne({ is_active: true });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active pricing plan found'
      });
    }

    // Calculate user cost
    // Calculate user cost (only charge when at least one module is selected)
    let userCost = 0;
    if (selected_modules && selected_modules.length > 0) {
      userCost = plan.per_user_cost * number_of_users;
    }

    // Calculate module cost
    let moduleCost = 0;
    const moduleDetails = [];

    if (selected_modules && selected_modules.length > 0) {
      for (const moduleName of selected_modules) {
        const moduleConfig = plan.modules.find(m => m.module_name === moduleName);
        if (moduleConfig) {
          moduleCost += moduleConfig.cost_per_module;
          moduleDetails.push({
            display_value: moduleConfig.display_value,
            module_name: moduleName,
            cost: moduleConfig.cost_per_module
          });
        }
      }
    }

    // Calculate total for the period
    const dailyRate = userCost + moduleCost;
    const totalAmount = dailyRate * number_of_days;

    res.status(200).json({
      success: true,
      data: {
        per_user_cost: plan.per_user_cost,
        user_cost: userCost,
        module_cost: moduleCost,
        daily_rate: dailyRate,
        total_amount: totalAmount,
        module_details: moduleDetails,
        breakdown: {
          users: `${number_of_users} users × $${plan.per_user_cost} × ${number_of_days} days = $${userCost * number_of_days}`,
          modules: `Modules × ${number_of_days} days = $${moduleCost * number_of_days}`,
          total: `Total = $${totalAmount}`
        }
      }
    });
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating price'
    });
  }
};

// Create subscription
const createSubscription = async (req, res) => {
  try {
    const {
      number_of_days,
      number_of_users,
      selected_modules,
      total_amount,
      payment_method
    } = req.body;

    const companyId = req.user.company_id;

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + number_of_days);

    const gracePeriodEnd = new Date(endDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 2); // 2 days grace period

    // Get module details with costs
    const plan = await Plan.findOne({ is_active: true });
    const moduleDetails = [];

    if (selected_modules && selected_modules.length > 0) {
      for (const moduleName of selected_modules) {
        const moduleConfig = plan.modules.find(m => m.module_name === moduleName);
        if (moduleConfig) {
          moduleDetails.push({
            module_name: moduleName,
            cost: moduleConfig.cost_per_module
          });
        }
      }
    }

    const subscription = new Subscription({
      company_id: companyId,
      number_of_days,
      number_of_users,
      selected_modules: moduleDetails,
      total_amount,
      subscription_start_date: startDate,
      subscription_end_date: endDate,
      grace_period_end: gracePeriodEnd,
      payment_method,
      payment_status: 'pending'
    });

    await subscription.save();

    await logEvent({
      event_type: 'system_operation',
      event_action: 'subscription_created',
      event_description: `Subscription created for company`,
      company_id: companyId,
      user_id: req.user.id,
      metadata: {
        subscription_id: subscription._id,
        amount: total_amount,
        payment_method
      }
    });

    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription'
    });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { payment_status, payment_transaction_id } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    subscription.payment_status = payment_status;
    if (payment_transaction_id) {
      subscription.payment_transaction_id = payment_transaction_id;
    }

    await subscription.save();

    // If payment completed, update company subscription status
    if (payment_status === 'completed') {
      await Company.findByIdAndUpdate(subscription.company_id, {
        subscription_status: 'active',
        subscription_start_date: subscription.subscription_start_date,
        subscription_end_date: subscription.subscription_end_date,
        user_limit: subscription.number_of_users
      });

      await logEvent({
        event_type: 'system_operation',
        event_action: 'payment_completed',
        event_description: `Payment completed for subscription`,
        company_id: subscription.company_id,
        metadata: {
          subscription_id: subscription._id,
          transaction_id: payment_transaction_id
        }
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment status'
    });
  }
};

// Get company subscription
const getCompanySubscription = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const subscription = await Subscription.findOne({
      company_id: companyId,
      is_active: true
    }).sort({ created_at: -1 });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...subscription.toObject(),
        subscription_status: subscription.subscription_status,
        days_remaining: subscription.days_remaining
      }
    });
  } catch (error) {
    console.error('Get company subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription'
    });
  }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    // Get company with subscription status
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Get active subscription if exists
    const activeSubscription = await Subscription.findOne({
      company_id: companyId,
      is_active: true
    }).sort({ created_at: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        status: company.subscription_status,
        ends_at: company.subscription_end_date,
        active_subscription: activeSubscription,
        grace_period: activeSubscription?.grace_period_end || null,
        days_remaining: activeSubscription?.days_remaining || 0
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription status'
    });
  }
};

// Get subscription history
const getSubscriptionHistory = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const subscriptions = await Subscription.find({
      company_id: companyId
    }).sort({ created_at: -1 });

    const history = subscriptions.map(sub => ({
      ...sub.toObject(),
      subscription_status: sub.subscription_status,
      days_remaining: sub.days_remaining
    }));

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription history'
    });
  }
};

module.exports = {
  getPricingConfig,
  calculatePrice,
  createSubscription,
  updatePaymentStatus,
  getCompanySubscription,
  getSubscriptionHistory,
  getSubscriptionStatus
};


const Company = require('../models/Company');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const MasterAdmin = require('../models/MasterAdmin');
const { logEvent } = require('./logs.controller');

// @desc    Get plan configuration for pricing
// @route   GET /api/subscription/plan-config
// @access  Private (Company Super Admin)
const getPlanConfig = async (req, res) => {
  try {
    const plan = await Plan.findOne({ is_active: true });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active plan configuration found'
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('Get plan config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving plan configuration'
    });
  }
};

// @desc    Calculate subscription cost
// @route   POST /api/subscription/calculate-cost
// @access  Private (Company Super Admin)
const calculateCost = async (req, res) => {
  try {
    const { subscription_days, user_count, selected_modules } = req.body;

    if (!subscription_days || !user_count || !selected_modules) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const plan = await Plan.findOne({ is_active: true });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active plan configuration found'
      });
    }

    const totalCost = plan.calculateCost(user_count, selected_modules, subscription_days);

    res.status(200).json({
      success: true,
      data: {
        total_cost: totalCost,
        breakdown: {
          user_cost: plan.per_user_cost * user_count * subscription_days,
          module_cost: totalCost - (plan.per_user_cost * user_count * subscription_days),
          per_user_cost: plan.per_user_cost,
          days: subscription_days,
          users: user_count,
          modules: selected_modules.length
        }
      }
    });

  } catch (error) {
    console.error('Calculate cost error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating subscription cost'
    });
  }
};

// @desc    Create subscription
// @route   POST /api/subscription/create
// @access  Private (Company Super Admin)
const createSubscription = async (req, res) => {
  try {
    const { subscription_days, user_count, selected_modules, payment_method } = req.body;
    const userId = req.user.id;

    if (!subscription_days || !user_count || !selected_modules || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get user's company
    const User = require('../models/User');
    const user = await User.findById(userId).populate('company_id');
    
    if (!user || !user.company_id) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const company = user.company_id;

    // Get plan configuration
    const plan = await Plan.findOne({ is_active: true });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active plan configuration found'
      });
    }

    // Calculate cost
    const totalCost = plan.calculateCost(user_count, selected_modules, subscription_days);

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (subscription_days * 24 * 60 * 60 * 1000));

    // Create subscription record
    const subscription = new Subscription({
      company_id: company._id,
      subscription_days,
      user_count,
      selected_modules,
      amount: totalCost,
      payment_method,
      start_date: startDate,
      end_date: endDate,
      is_renewal: company.subscription_status !== 'inactive'
    });

    await subscription.save();

    // Update company with subscription details
    company.plan_id = plan._id;
    company.subscription_status = 'pending'; // Will be updated after payment
    company.subscription_days = subscription_days;
    company.user_limit = user_count;
    company.selected_modules = selected_modules;
    company.subscription_amount = totalCost;
    await company.save();

    await logEvent({
      event_type: 'subscription',
      event_action: 'subscription_created',
      event_description: `Subscription created for company: ${company.company_name}`,
      user_id: userId,
      company_id: company._id,
      metadata: { 
        subscription_id: subscription._id,
        amount: totalCost,
        payment_method,
        days: subscription_days,
        users: user_count,
        modules: selected_modules
      }
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription_id: subscription._id,
        amount: totalCost,
        payment_method
      }
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription'
    });
  }
};

// @desc    Complete subscription payment
// @route   POST /api/subscription/:id/complete
// @access  Private (Company Super Admin)
const completeSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_id, transaction_id } = req.body;

    const subscription = await Subscription.findById(id).populate('company_id');
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update subscription as completed
    subscription.payment_status = 'completed';
    subscription.payment_id = payment_id;
    subscription.transaction_id = transaction_id;
    await subscription.save();

    // Update company subscription status
    const company = subscription.company_id;
    company.subscription_status = 'active';
    company.subscription_start_date = subscription.start_date;
    company.subscription_end_date = subscription.end_date;
    await company.save();

    await logEvent({
      event_type: 'subscription',
      event_action: 'payment_completed',
      event_description: `Payment completed for subscription: ${subscription._id}`,
      company_id: company._id,
      metadata: { 
        subscription_id: subscription._id,
        payment_id,
        transaction_id,
        amount: subscription.amount
      }
    });

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        subscription_status: 'active',
        start_date: subscription.start_date,
        end_date: subscription.end_date
      }
    });

  } catch (error) {
    console.error('Complete subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing subscription'
    });
  }
};

// @desc    Get subscription history
// @route   GET /api/subscription/history
// @access  Private (Company Super Admin)
const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's company
    const User = require('../models/User');
    const user = await User.findById(userId).populate('company_id');
    
    if (!user || !user.company_id) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const subscriptions = await Subscription.find({ 
      company_id: user.company_id._id 
    }).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscription history'
    });
  }
};

// @desc    Get current subscription status
// @route   GET /api/subscription/status
// @access  Private (Company User)
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's company
    const User = require('../models/User');
    const user = await User.findById(userId).populate('company_id');
    
    if (!user || !user.company_id) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const company = user.company_id;

    res.status(200).json({
      success: true,
      data: {
        subscription_status: company.subscription_status,
        subscription_start_date: company.subscription_start_date,
        subscription_end_date: company.subscription_end_date,
        user_limit: company.user_limit,
        current_user_count: company.current_user_count,
        selected_modules: company.selected_modules,
        subscription_amount: company.subscription_amount,
        in_grace_period: company.isInGracePeriod(),
        grace_period_days: company.getGracePeriodDaysRemaining(),
        is_expired: company.isSubscriptionExpired()
      }
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscription status'
    });
  }
};

// @desc    Get payment gateway settings
// @route   GET /api/subscription/payment-settings
// @access  Private (Company Super Admin)
const getPaymentSettings = async (req, res) => {
  try {
    const masterAdmin = await MasterAdmin.findOne().select('payment_settings');
    
    if (!masterAdmin || !masterAdmin.payment_settings) {
      return res.status(404).json({
        success: false,
        message: 'Payment settings not configured'
      });
    }

    // Return only public keys and configuration, not secrets
    const publicSettings = {
      stripe: {
        public_key: masterAdmin.payment_settings.stripe?.public_key,
        enabled: !!(masterAdmin.payment_settings.stripe?.public_key && masterAdmin.payment_settings.stripe?.secret_key)
      },
      paypal: {
        client_id: masterAdmin.payment_settings.paypal?.client_id,
        mode: masterAdmin.payment_settings.paypal?.mode || 'sandbox',
        enabled: !!(masterAdmin.payment_settings.paypal?.client_id && masterAdmin.payment_settings.paypal?.client_secret)
      },
      razorpay: {
        key_id: masterAdmin.payment_settings.razorpay?.key_id,
        enabled: !!(masterAdmin.payment_settings.razorpay?.key_id && masterAdmin.payment_settings.razorpay?.key_secret)
      }
    };

    res.status(200).json({
      success: true,
      data: publicSettings
    });

  } catch (error) {
    console.error('Get payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment settings'
    });
  }
};

module.exports = {
  getPlanConfig,
  calculateCost,
  createSubscription,
  completeSubscription,
  getSubscriptionHistory,
  getSubscriptionStatus,
  getPaymentSettings
};

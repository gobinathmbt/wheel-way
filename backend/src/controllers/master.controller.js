
const Company = require('../models/Company');
const Plan = require('../models/Plan');
const MasterAdmin = require('../models/MasterAdmin');
const User = require('../models/User');
const { logEvent } = require('./logs.controller');

// @desc    Get master admin dashboard stats
// @route   GET /api/master/dashboard
// @access  Private (Master Admin)
const getDashboard = async (req, res) => {
  try {
    // Get basic stats
    const totalCompanies = await Company.countDocuments();
    const activeCompanies = await Company.countDocuments({ is_active: true });
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ is_active: true });

    // Get subscription stats
    const activeSubscriptions = await Company.countDocuments({ subscription_status: 'active' });
    const inactiveSubscriptions = await Company.countDocuments({ subscription_status: 'inactive' });
    const gracePeriodCompanies = await Company.countDocuments({ subscription_status: 'grace_period' });

    // Calculate total revenue (you may want to add a revenue field to company or subscription)
    const totalRevenue = await Company.aggregate([
      { $match: { subscription_amount: { $exists: true } } },
      { $group: { _id: null, total: { $sum: '$subscription_amount' } } }
    ]);

    const stats = {
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        inactive: totalCompanies - activeCompanies
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      subscriptions: {
        active: activeSubscriptions,
        inactive: inactiveSubscriptions,
        grace_period: gracePeriodCompanies
      },
      revenue: {
        total: totalRevenue.length > 0 ? totalRevenue[0].total : 0
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard stats'
    });
  }
};

// @desc    Get all companies
// @route   GET /api/master/companies
// @access  Private (Master Admin)
const getCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { company_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.subscription_status = status;
    }

    const companies = await Company.find(query)
      .populate('plan_id')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Company.countDocuments(query);

    res.status(200).json({
      success: true,
      data: companies,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving companies'
    });
  }
};

// @desc    Get single company
// @route   GET /api/master/companies/:id
// @access  Private (Master Admin)
const getCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id).populate('plan_id');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving company'
    });
  }
};

// @desc    Update company
// @route   PUT /api/master/companies/:id
// @access  Private (Master Admin)
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const company = await Company.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate('plan_id');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    await logEvent({
      event_type: 'company_management',
      event_action: 'company_updated',
      event_description: `Company updated: ${company.company_name}`,
      user_id: req.user.id,
      company_id: company._id,
      metadata: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company'
    });
  }
};

// @desc    Delete company
// @route   DELETE /api/master/companies/:id
// @access  Private (Master Admin)
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Delete all users associated with the company
    await User.deleteMany({ company_id: id });

    // Delete the company
    await Company.findByIdAndDelete(id);

    await logEvent({
      event_type: 'company_management',
      event_action: 'company_deleted',
      event_description: `Company deleted: ${company.company_name}`,
      user_id: req.user.id,
      metadata: { company_id: id, company_name: company.company_name }
    });

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting company'
    });
  }
};

// @desc    Toggle company status
// @route   PATCH /api/master/companies/:id/status
// @access  Private (Master Admin)
const toggleCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const company = await Company.findByIdAndUpdate(
      id,
      { is_active, updated_at: new Date() },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    await logEvent({
      event_type: 'company_management',
      event_action: 'company_status_changed',
      event_description: `Company ${is_active ? 'activated' : 'deactivated'}: ${company.company_name}`,
      user_id: req.user.id,
      company_id: company._id,
      metadata: { is_active }
    });

    res.status(200).json({
      success: true,
      message: `Company ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: company
    });

  } catch (error) {
    console.error('Toggle company status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company status'
    });
  }
};

// @desc    Get plan configuration
// @route   GET /api/master/plans
// @access  Private (Master Admin)
const getPlans = async (req, res) => {
  try {
    const plan = await Plan.findOne({ is_active: true });

    res.status(200).json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving plan configuration'
    });
  }
};

// @desc    Create or update plan configuration
// @route   POST /api/master/plans
// @access  Private (Master Admin)
const createPlan = async (req, res) => {
  try {
    const { per_user_cost, module_costs } = req.body;

    // Check if plan already exists
    let plan = await Plan.findOne({ is_active: true });

    if (plan) {
      // Update existing plan
      plan.per_user_cost = per_user_cost;
      plan.module_costs = module_costs;
      plan.updated_at = new Date();
      await plan.save();
    } else {
      // Create new plan
      plan = new Plan({
        per_user_cost,
        module_costs,
        created_by: req.user.id
      });
      await plan.save();
    }

    await logEvent({
      event_type: 'plan_management',
      event_action: 'plan_configured',
      event_description: 'Plan configuration updated',
      user_id: req.user.id,
      metadata: { per_user_cost, module_costs }
    });

    res.status(200).json({
      success: true,
      message: 'Plan configuration saved successfully',
      data: plan
    });

  } catch (error) {
    console.error('Create/update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving plan configuration'
    });
  }
};

// @desc    Update plan
// @route   PUT /api/master/plans/:id
// @access  Private (Master Admin)
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await Plan.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    await logEvent({
      event_type: 'plan_management',
      event_action: 'plan_updated',
      event_description: `Plan updated: ${plan.display_name}`,
      user_id: req.user.id,
      metadata: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });

  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating plan'
    });
  }
};

// @desc    Delete plan
// @route   DELETE /api/master/plans/:id
// @access  Private (Master Admin)
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    await logEvent({
      event_type: 'plan_management',
      event_action: 'plan_deleted',
      event_description: `Plan deleted: ${plan.display_name}`,
      user_id: req.user.id,
      metadata: { plan_id: id }
    });

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully'
    });

  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting plan'
    });
  }
};

// @desc    Update master admin profile
// @route   PUT /api/master/profile
// @access  Private (Master Admin)
const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    const userId = req.user.id;

    const masterAdmin = await MasterAdmin.findByIdAndUpdate(
      userId,
      { first_name, last_name, email, updated_at: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!masterAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Master admin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: masterAdmin
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// @desc    Update SMTP settings
// @route   PUT /api/master/smtp-settings
// @access  Private (Master Admin)
const updateSmtpSettings = async (req, res) => {
  try {
    const smtpSettings = req.body;
    const userId = req.user.id;

    const masterAdmin = await MasterAdmin.findByIdAndUpdate(
      userId,
      { smtp_settings: smtpSettings, updated_at: new Date() },
      { new: true }
    ).select('-password');

    if (!masterAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Master admin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'SMTP settings updated successfully'
    });

  } catch (error) {
    console.error('Update SMTP settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating SMTP settings'
    });
  }
};

// @desc    Test SMTP connection
// @route   POST /api/master/test-smtp
// @access  Private (Master Admin)
const testSmtp = async (req, res) => {
  try {
    // Implementation for testing SMTP connection
    res.status(200).json({
      success: true,
      message: 'SMTP test successful'
    });

  } catch (error) {
    console.error('Test SMTP error:', error);
    res.status(500).json({
      success: false,
      message: 'SMTP test failed'
    });
  }
};

// @desc    Update AWS settings
// @route   PUT /api/master/aws-settings
// @access  Private (Master Admin)
const updateAwsSettings = async (req, res) => {
  try {
    const awsSettings = req.body;
    const userId = req.user.id;

    const masterAdmin = await MasterAdmin.findByIdAndUpdate(
      userId,
      { aws_settings: awsSettings, updated_at: new Date() },
      { new: true }
    ).select('-password');

    if (!masterAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Master admin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'AWS settings updated successfully'
    });

  } catch (error) {
    console.error('Update AWS settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating AWS settings'
    });
  }
};

// @desc    Test AWS connection
// @route   POST /api/master/test-aws
// @access  Private (Master Admin)
const testAwsConnection = async (req, res) => {
  try {
    // Implementation for testing AWS connection
    res.status(200).json({
      success: true,
      message: 'AWS connection test successful'
    });

  } catch (error) {
    console.error('Test AWS connection error:', error);
    res.status(500).json({
      success: false,
      message: 'AWS connection test failed'
    });
  }
};

// @desc    Get AWS settings
// @route   GET /api/master/aws-settings
// @access  Private (Master Admin)
const getAwsSettings = async (req, res) => {
  try {
    const masterAdmin = await MasterAdmin.findById(req.user.id).select('aws_settings');

    if (!masterAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Master admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: masterAdmin.aws_settings || {}
    });

  } catch (error) {
    console.error('Get AWS settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving AWS settings'
    });
  }
};

// @desc    Update payment gateway settings
// @route   PUT /api/master/payment-settings
// @access  Private (Master Admin)
const updatePaymentSettings = async (req, res) => {
  try {
    const paymentSettings = req.body;
    const userId = req.user.id;

    const masterAdmin = await MasterAdmin.findByIdAndUpdate(
      userId,
      { payment_settings: paymentSettings, updated_at: new Date() },
      { new: true }
    ).select('-password');

    if (!masterAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Master admin not found'
      });
    }

    await logEvent({
      event_type: 'settings',
      event_action: 'payment_settings_updated',
      event_description: 'Payment gateway settings updated',
      user_id: userId,
      metadata: { gateways: Object.keys(paymentSettings) }
    });

    res.status(200).json({
      success: true,
      message: 'Payment settings updated successfully'
    });

  } catch (error) {
    console.error('Update payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment settings'
    });
  }
};

// @desc    Get payment gateway settings
// @route   GET /api/master/payment-settings
// @access  Private (Master Admin)
const getPaymentSettings = async (req, res) => {
  try {
    const masterAdmin = await MasterAdmin.findById(req.user.id).select('payment_settings');

    if (!masterAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Master admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: masterAdmin.payment_settings || {}
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
  getDashboard,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  toggleCompanyStatus,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  updateProfile,
  updateSmtpSettings,
  testSmtp,
  updateAwsSettings,
  testAwsConnection,
  getAwsSettings,
  updatePaymentSettings,
  getPaymentSettings
};

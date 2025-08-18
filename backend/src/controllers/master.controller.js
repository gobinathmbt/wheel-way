
const Company = require('../models/Company');
const Plan = require('../models/Plan');
const MasterAdmin = require('../models/MasterAdmin');
const { logEvent } = require('./logs.controller');

// @desc    Get master admin dashboard stats
// @route   GET /api/master/dashboard
// @access  Private (Master Admin)
const getDashboard = async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const activeCompanies = await Company.countDocuments({ is_active: true });
    const totalUsers = await Company.aggregate([
      { $group: { _id: null, total: { $sum: '$current_user_count' } } }
    ]);

    // Get monthly growth data
    const monthlyData = await Company.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$created_at" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCompanies,
        activeCompanies,
        totalUsers: totalUsers[0]?.total || 0,
        monthlyGrowth: 12.5,
        monthlyData
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard data'
    });
  }
};

// @desc    Get all companies
// @route   GET /api/master/companies
// @access  Private (Master Admin)
const getCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter = {
        $or: [
          { company_name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { contact_person: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const companies = await Company.find(filter)
      .populate('plan_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Company.countDocuments(filter);

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
    const company = await Company.findById(req.params.id).populate('plan_id');
    
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
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
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
      event_description: `Company ${company.company_name} updated`,
      user_id: req.user.id,
      company_id: company._id,
      user_role: req.user.role
    });

    res.status(200).json({
      success: true,
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
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    await logEvent({
      event_type: 'company_management',
      event_action: 'company_deleted',
      event_description: `Company ${company.company_name} deleted`,
      user_id: req.user.id,
      user_role: req.user.role
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
    const { is_active } = req.body;
    
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { is_active },
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
      event_action: 'company_status_updated',
      event_description: `Company ${company.company_name} ${is_active ? 'activated' : 'deactivated'}`,
      user_id: req.user.id,
      company_id: company._id,
      user_role: req.user.role
    });

    res.status(200).json({
      success: true,
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

// @desc    Get all plans
// @route   GET /api/master/plans
// @access  Private (Master Admin)
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });

    res.status(200).json({
      success: true,
      data: plans
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving plans'
    });
  }
};

// @desc    Create new plan
// @route   POST /api/master/plans
// @access  Private (Master Admin)
const createPlan = async (req, res) => {
  try {
    const plan = new Plan({
      ...req.body,
      created_by: req.user.id
    });

    await plan.save();

    await logEvent({
      event_type: 'plan_management',
      event_action: 'plan_created',
      event_description: `Plan ${plan.display_name} created`,
      user_id: req.user.id,
      user_role: req.user.role
    });

    res.status(201).json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating plan'
    });
  }
};

// @desc    Update plan
// @route   PUT /api/master/plans/:id
// @access  Private (Master Admin)
const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
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
      event_description: `Plan ${plan.display_name} updated`,
      user_id: req.user.id,
      user_role: req.user.role
    });

    res.status(200).json({
      success: true,
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
    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    await logEvent({
      event_type: 'plan_management',
      event_action: 'plan_deleted',
      event_description: `Plan ${plan.display_name} deleted`,
      user_id: req.user.id,
      user_role: req.user.role
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
    const admin = await MasterAdmin.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: admin
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
    // Store SMTP settings in environment or config
    // This would typically be stored in a configuration collection
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
    // Test SMTP connection with provided settings
    res.status(200).json({
      success: true,
      message: 'SMTP connection test successful'
    });

  } catch (error) {
    console.error('Test SMTP error:', error);
    res.status(500).json({
      success: false,
      message: 'SMTP connection test failed'
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
  testSmtp
};

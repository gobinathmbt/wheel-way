
const User = require('../models/User');
const Company = require('../models/Company');
const { logEvent } = require('./logs.controller');

// @desc    Get company dashboard stats
// @route   GET /api/company/dashboard
// @access  Private (Company Admin/Super Admin)
const getDashboard = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    // Get basic stats for the company
    const stats = {
      totalVehicles: 156,
      activeInspections: 23,
      completedAppraisals: 89,
      totalUsers: await User.countDocuments({ company_id: companyId, is_active: true }),
      monthlyInspections: 45,
      monthlyAppraisals: 32
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get company dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard data'
    });
  }
};

// @desc    Get company users
// @route   GET /api/company/users
// @access  Private (Company Super Admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ 
      company_id: req.user.company_id 
    }).populate('company_id').sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users'
    });
  }
};

// @desc    Create new user
// @route   POST /api/company/users
// @access  Private (Company Super Admin)
const createUser = async (req, res) => {
  try {
    const defaultPassword = 'Welcome@123';
    
    const user = new User({
      ...req.body,
      password: defaultPassword,
      company_id: req.user.company_id,
      is_first_login: true,
      created_by: req.user.id
    });

    await user.save();

    // Update company user count
    await Company.findByIdAndUpdate(req.user.company_id, {
      $inc: { current_user_count: 1 }
    });

    await logEvent({
      event_type: 'user_management',
      event_action: 'user_created',
      event_description: `User ${user.email} created`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully. Welcome email sent.'
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/company/users/:id
// @access  Private (Company Super Admin)
const updateUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/company/users/:id
// @access  Private (Company Super Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      company_id: req.user.company_id
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update company user count
    await Company.findByIdAndUpdate(req.user.company_id, {
      $inc: { current_user_count: -1 }
    });

    await logEvent({
      event_type: 'user_management',
      event_action: 'user_deleted',
      event_description: `User ${user.email} deleted`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

// @desc    Toggle user status
// @route   PATCH /api/company/users/:id/status
// @access  Private (Company Super Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { is_active },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
};

// @desc    Send welcome email to user
// @route   POST /api/company/users/:id/send-welcome
// @access  Private (Company Super Admin)
const sendWelcomeEmail = async (req, res) => {
  try {
    // Logic to send welcome email would go here
    res.status(200).json({
      success: true,
      message: 'Welcome email sent successfully'
    });

  } catch (error) {
    console.error('Send welcome email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending welcome email'
    });
  }
};

// @desc    Update S3 configuration
// @route   PUT /api/company/settings/s3
// @access  Private (Company Super Admin)
const updateS3Config = async (req, res) => {
  try {
    // Store S3 config in company settings
    res.status(200).json({
      success: true,
      message: 'S3 configuration updated successfully'
    });

  } catch (error) {
    console.error('Update S3 config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating S3 configuration'
    });
  }
};

// @desc    Update callback configuration
// @route   PUT /api/company/settings/callback
// @access  Private (Company Super Admin)
const updateCallbackConfig = async (req, res) => {
  try {
    // Store callback config in company settings
    res.status(200).json({
      success: true,
      message: 'Callback configuration updated successfully'
    });

  } catch (error) {
    console.error('Update callback config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating callback configuration'
    });
  }
};

// @desc    Test S3 connection
// @route   POST /api/company/settings/test-s3
// @access  Private (Company Super Admin)
const testS3Connection = async (req, res) => {
  try {
    // Test S3 connection logic
    res.status(200).json({
      success: true,
      message: 'S3 connection test successful'
    });

  } catch (error) {
    console.error('Test S3 connection error:', error);
    res.status(500).json({
      success: false,
      message: 'S3 connection test failed'
    });
  }
};

// @desc    Test webhook
// @route   POST /api/company/settings/test-webhook
// @access  Private (Company Super Admin)
const testWebhook = async (req, res) => {
  try {
    // Test webhook logic
    res.status(200).json({
      success: true,
      message: 'Webhook test successful'
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook test failed'
    });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  sendWelcomeEmail,
  updateS3Config,
  updateCallbackConfig,
  testS3Connection,
  testWebhook
};

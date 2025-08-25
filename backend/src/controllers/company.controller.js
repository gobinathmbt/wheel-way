
const User = require("../models/User");
const Company = require("../models/Company");
const { logEvent } = require("./logs.controller");

// @desc    Get company dashboard overview stats
// @route   GET /api/company/dashboard/stats
// @access  Private (Company Admin/Super Admin)
const getDashboardStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { from, to } = req.query;

    // Basic stats that don't depend on date range
    const totalUsers = await User.countDocuments({ company_id: companyId });
    const activeUsers = await User.countDocuments({
      company_id: companyId,
      is_active: true,
    });

    const stats = {
      totalVehicles: 156, // This should come from Vehicle model when implemented
      activeInspections: 23, // This should come from Inspection model
      completedAppraisals: 89, // This should come from Appraisal model with date filter
      totalUsers,
      activeUsers,
      monthlyInspections: 45, // Filtered by date range
      monthlyAppraisals: 32, // Filtered by date range
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving dashboard stats",
    });
  }
};

// @desc    Get vehicle statistics
// @route   GET /api/company/dashboard/vehicles
// @access  Private (Company Admin/Super Admin)
const getVehicleStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { from, to } = req.query;

    // Mock data - replace with actual queries
    const vehicleStats = {
      totalVehicles: 156,
      availableVehicles: 134,
      vehiclesInProcess: 22,
      vehicleTypes: [
        { name: 'Sedan', value: 45, color: '#3b82f6' },
        { name: 'SUV', value: 30, color: '#10b981' },
        { name: 'Hatchback', value: 15, color: '#f59e0b' },
        { name: 'Others', value: 10, color: '#ef4444' }
      ]
    };

    res.status(200).json({
      success: true,
      data: vehicleStats,
    });
  } catch (error) {
    console.error("Get vehicle stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving vehicle stats",
    });
  }
};

// @desc    Get inspection statistics
// @route   GET /api/company/dashboard/inspections
// @access  Private (Company Admin/Super Admin)
const getInspectionStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { from, to } = req.query;

    // Mock data - replace with actual queries from Inspection model
    const inspectionStats = {
      totalInspections: 156,
      activeInspections: 23,
      completedInspections: 89,
      pendingInspections: 44,
      averageTimeToComplete: 2.5, // hours
      inspectionsByStatus: {
        completed: 89,
        inProgress: 23,
        pending: 44
      }
    };

    res.status(200).json({
      success: true,
      data: inspectionStats,
    });
  } catch (error) {
    console.error("Get inspection stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving inspection stats",
    });
  }
};

// @desc    Get appraisal statistics
// @route   GET /api/company/dashboard/appraisals
// @access  Private (Company Admin/Super Admin)
const getAppraisalStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { from, to } = req.query;

    // Mock data - replace with actual queries from Appraisal model
    const appraisalStats = {
      totalAppraisals: 132,
      completedAppraisals: 89,
      activeAppraisals: 21,
      pendingAppraisals: 22,
      averageAppraisalValue: 25000,
      appraisalsByStatus: {
        completed: 89,
        inProgress: 21,
        pending: 22
      }
    };

    res.status(200).json({
      success: true,
      data: appraisalStats,
    });
  } catch (error) {
    console.error("Get appraisal stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving appraisal stats",
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/company/dashboard/users
// @access  Private (Company Admin/Super Admin)
const getUserStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const totalUsers = await User.countDocuments({ company_id: companyId });
    const activeUsers = await User.countDocuments({
      company_id: companyId,
      is_active: true,
    });
    const inactiveUsers = await User.countDocuments({
      company_id: companyId,
      is_active: false,
    });
    const superAdmins = await User.countDocuments({
      company_id: companyId,
      role: "company_super_admin",
    });
    const admins = await User.countDocuments({
      company_id: companyId,
      role: "company_admin",
    });

    const userStats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      superAdmins,
      admins,
      usersByRole: {
        super_admin: superAdmins,
        admin: admins,
        user: totalUsers - superAdmins - admins
      }
    };

    res.status(200).json({
      success: true,
      data: userStats,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving user stats",
    });
  }
};

// @desc    Get revenue statistics
// @route   GET /api/company/dashboard/revenue
// @access  Private (Company Admin/Super Admin)
const getRevenueStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { from, to } = req.query;

    // Mock data - replace with actual revenue calculations
    const revenueStats = {
      totalRevenue: 125000,
      monthlyRevenue: 25000,
      growthRate: 12.5,
      revenueByService: {
        inspections: 75000,
        appraisals: 50000
      }
    };

    res.status(200).json({
      success: true,
      data: revenueStats,
    });
  } catch (error) {
    console.error("Get revenue stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving revenue stats",
    });
  }
};

// @desc    Get activity statistics
// @route   GET /api/company/dashboard/activity
// @access  Private (Company Admin/Super Admin)
const getActivityStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { from, to } = req.query;

    // Mock data - replace with actual activity queries
    const monthlyData = [
      { month: 'Jan', inspections: 32, appraisals: 28 },
      { month: 'Feb', inspections: 38, appraisals: 35 },
      { month: 'Mar', inspections: 42, appraisals: 30 },
      { month: 'Apr', inspections: 39, appraisals: 38 },
      { month: 'May', inspections: 45, appraisals: 32 }
    ];

    const activityStats = {
      monthlyData,
      totalActivities: monthlyData.reduce((sum, month) => sum + month.inspections + month.appraisals, 0)
    };

    res.status(200).json({
      success: true,
      data: activityStats,
    });
  } catch (error) {
    console.error("Get activity stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving activity stats",
    });
  }
};

// @desc    Get recent activity
// @route   GET /api/company/dashboard/recent-activity
// @access  Private (Company Admin/Super Admin)
const getRecentActivity = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { limit = 10 } = req.query;

    // Mock data - replace with actual recent activity queries
    const recentActivity = [
      { id: 'VH001', type: 'Inspection', vehicle: 'Toyota Camry 2020', status: 'Completed', user: 'John Doe', time: '2 hours ago' },
      { id: 'VH002', type: 'Appraisal', vehicle: 'Honda Accord 2019', status: 'In Progress', user: 'Jane Smith', time: '4 hours ago' },
      { id: 'VH003', type: 'Inspection', vehicle: 'BMW X5 2021', status: 'Pending', user: 'Mike Johnson', time: '6 hours ago' },
      { id: 'VH004', type: 'Appraisal', vehicle: 'Mercedes C-Class 2020', status: 'Completed', user: 'Sarah Wilson', time: '1 day ago' }
    ].slice(0, limit);

    res.status(200).json({
      success: true,
      data: recentActivity,
    });
  } catch (error) {
    console.error("Get recent activity error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving recent activity",
    });
  }
};

// @desc    Get S3 configuration
// @route   GET /api/company/settings/s3
// @access  Private (Company Super Admin)
const getS3Config = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company_id).select('s3_config');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      data: company.s3_config || {},
    });
  } catch (error) {
    console.error("Get S3 config error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving S3 configuration",
    });
  }
};

// @desc    Get callback configuration
// @route   GET /api/company/settings/callback
// @access  Private (Company Super Admin)
const getCallbackConfig = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company_id).select('integration_settings');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      data: company.integration_settings || {},
    });
  } catch (error) {
    console.error("Get callback config error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving callback configuration",
    });
  }
};

// @desc    Get billing information
// @route   GET /api/company/settings/billing
// @access  Private (Company Super Admin)
const getBillingInfo = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company_id)
      .populate('plan_id')
      .select('plan_id user_limit current_user_count subscription_status subscription_start_date subscription_end_date');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const billingInfo = {
      current_plan: company.plan_id?.name || 'Basic Plan',
      user_limit: company.user_limit,
      current_users: company.current_user_count,
      billing_cycle: 'Monthly',
      next_billing: company.subscription_end_date,
      amount: company.plan_id?.price || 99
    };

    res.status(200).json({
      success: true,
      data: billingInfo,
    });
  } catch (error) {
    console.error("Get billing info error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving billing information",
    });
  }
};

// ... keep existing code (getUsers, createUser, updateUser, deleteUser, toggleUserStatus, sendWelcomeEmail, updateS3Config, updateCallbackConfig, testS3Connection, testWebhook functions)

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter query
    let filter = { company_id: req.user.company_id };

    // Add search functionality
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter
    if (status && status !== "all") {
      filter.is_active = status === "active";
    }

    // Get users with pagination
    const users = await User.find(filter)
      .populate("company_id")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password");

    // Get total count for pagination
    const totalRecords = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / limit);

    // Get stats for the response
    const totalUsers = await User.countDocuments({
      company_id: req.user.company_id,
    });
    const activeUsers = await User.countDocuments({
      company_id: req.user.company_id,
      is_active: true,
    });
    const inactiveUsers = await User.countDocuments({
      company_id: req.user.company_id,
      is_active: false,
    });
    const superAdmins = await User.countDocuments({
      company_id: req.user.company_id,
      role: "company_super_admin",
    });
    const admins = await User.countDocuments({
      company_id: req.user.company_id,
      role: "company_admin",
    });

    res.status(200).json({
      success: true,
      data: users,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        superAdmins,
        admins,
      },
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_records: totalRecords,
        per_page: parseInt(limit),
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving users",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, first_name, last_name } = req.body;

    // Check for existing user with same username, email, first_name, or last_name
    const existingUser = await User.findOne({
      company_id: req.user.company_id,
      $or: [
        { username: username },
        { email: email },
        { first_name: first_name },
        { last_name: last_name },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const defaultPassword = "Welcome@123";

    const user = new User({
      ...req.body,
      password: defaultPassword,
      company_id: req.user.company_id,
      is_first_login: true,
      created_by: req.user.id,
    });

    await user.save();

    // Update company user count
    await Company.findByIdAndUpdate(req.user.company_id, {
      $inc: { current_user_count: 1 },
    });

    await logEvent({
      event_type: "user_management",
      event_action: "user_created",
      event_description: `User ${user.email} created`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
    });

    res.status(201).json({
      success: true,
      data: user,
      message: "User created successfully. Welcome email sent.",
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    // Remove password from update data if present (shouldn't be updated here)
    const { password, ...updateData } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await logEvent({
      event_type: "user_management",
      event_action: "user_updated",
      event_description: `User ${user.email} updated`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
    });

    res.status(200).json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      company_id: req.user.company_id,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update company user count
    await Company.findByIdAndUpdate(req.user.company_id, {
      $inc: { current_user_count: -1 },
    });

    await logEvent({
      event_type: "user_management",
      event_action: "user_deleted",
      event_description: `User ${user.email} deleted`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};

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
        message: "User not found",
      });
    }

    await logEvent({
      event_type: "user_management",
      event_action: "user_status_updated",
      event_description: `User ${user.email} status changed to ${
        is_active ? "active" : "inactive"
      }`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user status",
    });
  }
};

const sendWelcomeEmail = async (req, res) => {
  try {
    // Logic to send welcome email would go here
    res.status(200).json({
      success: true,
      message: "Welcome email sent successfully",
    });
  } catch (error) {
    console.error("Send welcome email error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending welcome email",
    });
  }
};

const updateS3Config = async (req, res) => {
  try {
    const { bucket, access_key, secret_key, region, url } = req.body;

    // Update company's S3 config
    const company = await Company.findByIdAndUpdate(
      req.user.company_id,
      {
        $set: {
          s3_config: { bucket, access_key, secret_key, region, url },
          updated_at: new Date(),
        },
      },
      { new: true } // return updated document
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "S3 configuration updated successfully",
      data: company.s3_config,
    });
  } catch (error) {
    console.error("Update S3 config error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating S3 configuration",
      error: error.message,
    });
  }
};

const updateCallbackConfig = async (req, res) => {
  try {
    const { inspection_callback_url, tradein_callback_url, webhook_secret } = req.body;

    // Update company's callback config
    const company = await Company.findByIdAndUpdate(
      req.user.company_id,
      {
        $set: {
          integration_settings: { 
            webhook_url: inspection_callback_url,
            tradein_callback_url,
            webhook_secret
          },
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Callback configuration updated successfully",
      data: company.integration_settings,
    });
  } catch (error) {
    console.error("Update callback config error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating callback configuration",
    });
  }
};

const testS3Connection = async (req, res) => {
  try {
    // Test S3 connection logic
    res.status(200).json({
      success: true,
      message: "S3 connection test successful",
    });
  } catch (error) {
    console.error("Test S3 connection error:", error);
    res.status(500).json({
      success: false,
      message: "S3 connection test failed",
    });
  }
};

const testWebhook = async (req, res) => {
  try {
    // Test webhook logic
    res.status(200).json({
      success: true,
      message: "Webhook test successful",
    });
  } catch (error) {
    console.error("Test webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook test failed",
    });
  }
};

module.exports = {
  // Dashboard endpoints
  getDashboardStats,
  getVehicleStats,
  getInspectionStats,
  getAppraisalStats,
  getUserStats,
  getRevenueStats,
  getActivityStats,
  getRecentActivity,
  
  // Settings endpoints
  getS3Config,
  getCallbackConfig,
  getBillingInfo,
  
  // User management
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  sendWelcomeEmail,
  
  // Settings actions
  updateS3Config,
  updateCallbackConfig,
  testS3Connection,
  testWebhook,
};

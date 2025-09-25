const NotificationConfiguration = require('../models/NotificationConfiguration');
const Company = require('../models/Company');
const User = require('../models/User');

// Get all notification configurations for a company
const getNotificationConfigurations = async (req, res) => {

  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const companyId = req.user.company_id;

    // Build query
    const query = { company_id: companyId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { target_schema: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'all') {
      query.is_active = status === 'active';
    }

    // Execute query with pagination
    const configurations = await NotificationConfiguration.find(query)
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .populate('target_users.user_ids', 'first_name last_name email')
      .sort({ created_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await NotificationConfiguration.countDocuments(query);

    res.json({
      success: true,
      data: {
        configurations,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_records: total,
          has_next: page * limit < total,
          has_previous: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notification configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification configurations',
      error: error.message
    });
  }
};

// Get single notification configuration
const getNotificationConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const configuration = await NotificationConfiguration.findOne({
      _id: id,
      company_id: companyId
    })
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .populate('target_users.user_ids', 'first_name last_name email');

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Notification configuration not found'
      });
    }

    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Error fetching notification configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification configuration',
      error: error.message
    });
  }
};

// Create notification configuration
const createNotificationConfiguration = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const userId = req.user.id;

    // Validate company super admin role
    if (req.user.role !== 'company_super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only company super admin can create notification configurations'
      });
    }

    const configurationData = {
      ...req.body,
      company_id: companyId,
      created_by: userId
    };

    // Validate target users if specific users are selected
    if (configurationData.target_users?.type === 'specific_users' && configurationData.target_users?.user_ids?.length > 0) {
      const validUsers = await User.find({
        _id: { $in: configurationData.target_users.user_ids },
        company_id: companyId,
        is_active: true
      });

      if (validUsers.length !== configurationData.target_users.user_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'Some selected users are invalid or inactive'
        });
      }
    }

    const configuration = await NotificationConfiguration.create(configurationData);
    
    // Add to company's notification configurations
    await Company.findByIdAndUpdate(
      companyId,
      { $push: { notification_configurations: configuration._id } }
    );

    // Populate and return
    await configuration.populate([
      { path: 'created_by', select: 'first_name last_name email' },
      { path: 'target_users.user_ids', select: 'first_name last_name email' }
    ]);

    res.status(201).json({
      success: true,
      data: configuration,
      message: 'Notification configuration created successfully'
    });
  } catch (error) {
    console.error('Error creating notification configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification configuration',
      error: error.message
    });
  }
};

// Update notification configuration
const updateNotificationConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const userId = req.user.id;

    // Validate company super admin role
    if (req.user.role !== 'company_super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only company super admin can update notification configurations'
      });
    }

    const updateData = {
      ...req.body,
      updated_by: userId
    };

    // Validate target users if specific users are selected
    if (updateData.target_users?.type === 'specific_users' && updateData.target_users?.user_ids?.length > 0) {
      const validUsers = await User.find({
        _id: { $in: updateData.target_users.user_ids },
        company_id: companyId,
        is_active: true
      });

      if (validUsers.length !== updateData.target_users.user_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'Some selected users are invalid or inactive'
        });
      }
    }

    const configuration = await NotificationConfiguration.findOneAndUpdate(
      { _id: id, company_id: companyId },
      updateData,
      { new: true }
    )
      .populate('created_by', 'first_name last_name email')
      .populate('updated_by', 'first_name last_name email')
      .populate('target_users.user_ids', 'first_name last_name email');

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Notification configuration not found'
      });
    }

    res.json({
      success: true,
      data: configuration,
      message: 'Notification configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification configuration',
      error: error.message
    });
  }
};

// Delete notification configuration
const deleteNotificationConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    // Validate company super admin role
    if (req.user.role !== 'company_super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only company super admin can delete notification configurations'
      });
    }

    const configuration = await NotificationConfiguration.findOneAndDelete({
      _id: id,
      company_id: companyId
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Notification configuration not found'
      });
    }

    // Remove from company's notification configurations
    await Company.findByIdAndUpdate(
      companyId,
      { $pull: { notification_configurations: id } }
    );

    res.json({
      success: true,
      message: 'Notification configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification configuration',
      error: error.message
    });
  }
};

// Toggle notification configuration status
const toggleNotificationConfigurationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const companyId = req.user.company_id;

    // Validate company super admin role
    if (req.user.role !== 'company_super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only company super admin can toggle notification configuration status'
      });
    }

    const configuration = await NotificationConfiguration.findOneAndUpdate(
      { _id: id, company_id: companyId },
      { is_active, updated_by: req.user.id },
      { new: true }
    );

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Notification configuration not found'
      });
    }

    res.json({
      success: true,
      data: configuration,
      message: `Notification configuration ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling notification configuration status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling notification configuration status',
      error: error.message
    });
  }
};

// Get available schemas and their fields
const getAvailableSchemas = async (req, res) => {
  try {
    const schemas = {
      'User': {
        fields: ['first_name', 'last_name', 'email', 'role', 'is_active', 'last_login'],
        relationships: ['company_id', 'dealership_ids']
      },
      'Vehicle': {
        fields: ['stock_id', 'make', 'model', 'year', 'status', 'price'],
        relationships: ['make', 'model', 'variant', 'body']
      },
      'Inspection': {
        fields: ['inspection_id', 'status', 'score', 'completed_at'],
        relationships: ['vehicle_id', 'user_id']
      },
      'Workshop': {
        fields: ['workshop_name', 'status', 'type'],
        relationships: ['vehicle_id', 'supplier_id']
      },
      'Supplier': {
        fields: ['supplier_name', 'email', 'status', 'rating'],
        relationships: ['company_id']
      },
      'Make': {
        fields: ['displayName', 'displayValue', 'isActive'],
        relationships: []
      },
      'Model': {
        fields: ['displayName', 'displayValue', 'isActive'],
        relationships: ['make']
      },
      'Variant': {
        fields: ['displayName', 'displayValue', 'isActive'],
        relationships: ['models']
      },
      'Body': {
        fields: ['displayName', 'displayValue', 'isActive'],
        relationships: []
      },
      'VehicleMetadata': {
        fields: ['fuelType', 'transmission', 'engineCapacity', 'power', 'seatingCapacity'],
        relationships: ['make', 'model', 'variant', 'body', 'variantYear']
      }
    };

    res.json({
      success: true,
      data: schemas
    });
  } catch (error) {
    console.error('Error fetching available schemas:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available schemas',
      error: error.message
    });
  }
};

// Get users for target selection
const getCompanyUsers = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    const users = await User.find({
      company_id: companyId,
      is_active: true
    })
      .select('first_name last_name email role')
      .sort({ first_name: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching company users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company users',
      error: error.message
    });
  }
};

module.exports = {
  getNotificationConfigurations,
  getNotificationConfiguration,
  createNotificationConfiguration,
  updateNotificationConfiguration,
  deleteNotificationConfiguration,
  toggleNotificationConfigurationStatus,
  getAvailableSchemas,
  getCompanyUsers
};
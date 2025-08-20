

const InspectionConfig = require('../models/InspectionConfig');
const TradeinConfig = require('../models/TradeinConfig');
const DropdownMaster = require('../models/DropdownMaster');
const { logEvent } = require('./logs.controller');

const getInspectionConfigs = async (req, res) => {
  try {
    const { page = 1, limit = 6, search = '', status = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = {
      company_id: req.user.company_id
    };

    if (search) {
      searchQuery.config_name = { $regex: search, $options: 'i' };
    }

    // Apply status filter only if it's not "all"
    if (status && status !== 'all') {
      searchQuery.is_active = status === 'active';
    }

    const configs = await InspectionConfig.find(searchQuery)
      .select('config_name description version is_active is_default created_at updated_at')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InspectionConfig.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      data: configs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get inspection configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving inspection configurations'
    });
  }
};

const getInspectionConfigDetails = async (req, res) => {
  try {
    const config = await InspectionConfig.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.status(200).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Get inspection config details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving configuration details'
    });
  }
};

const createInspectionConfig = async (req, res) => {
  try {
    // Check if config name already exists for this company
    const existingConfig = await InspectionConfig.findOne({
      config_name: req.body.config_name,
      company_id: req.user.company_id
    });

    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: 'Configuration name already exists'
      });
    }

    // If this is set as default, deactivate other defaults
    if (req.body.is_default) {
      await InspectionConfig.updateMany(
        { company_id: req.user.company_id, is_default: true },
        { is_default: false }
      );
    }

    // If this is set as active, deactivate other active configs
    if (req.body.is_active) {
      await InspectionConfig.updateMany(
        { company_id: req.user.company_id, is_active: true },
        { is_active: false }
      );
    }

    const config = new InspectionConfig({
      ...req.body,
      company_id: req.user.company_id,
      created_by: req.user.id,
      categories: [
        {
          category_id: 'at_arrival',
          category_name: 'At Arrival',
          description: 'Initial vehicle inspection upon arrival',
          sections: []
        },
        {
          category_id: 'after_reconditioning',
          category_name: 'After Reconditioning',
          description: 'Inspection after vehicle reconditioning',
          sections: []
        },
        {
          category_id: 'after_grooming',
          category_name: 'After Grooming',
          description: 'Final inspection after grooming',
          sections: []
        }
      ]
    });

    await config.save();

    res.status(201).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Create inspection config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating inspection configuration'
    });
  }
};

const updateInspectionConfig = async (req, res) => {
  try {
    // Check if new config name already exists for this company (excluding current config)
    if (req.body.config_name) {
      const existingConfig = await InspectionConfig.findOne({
        config_name: req.body.config_name,
        company_id: req.user.company_id,
        _id: { $ne: req.params.id }
      });

      if (existingConfig) {
        return res.status(400).json({
          success: false,
          message: 'Configuration name already exists'
        });
      }
    }

    // If this is set as active, deactivate other active configs
    if (req.body.is_active) {
      await InspectionConfig.updateMany(
        {
          company_id: req.user.company_id,
          is_active: true,
          _id: { $ne: req.params.id }
        },
        { is_active: false }
      );
    }

    const config = await InspectionConfig.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.status(200).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Update inspection config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inspection configuration'
    });
  }
};

// ... keep existing code (deleteInspectionConfig, addInspectionSection, addInspectionField functions)

const deleteInspectionConfig = async (req, res) => {
  try {
    const config = await InspectionConfig.findOneAndDelete({
      _id: req.params.id,
      company_id: req.user.company_id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Configuration deleted successfully'
    });

  } catch (error) {
    console.error('Delete inspection config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting inspection configuration'
    });
  }
};

const addInspectionSection = async (req, res) => {
  try {
    const config = await InspectionConfig.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    const category = config.categories.find(cat => cat.category_id === req.params.categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const newSection = {
      ...req.body,
      section_id: `section_${Date.now()}`,
      fields: []
    };

    category.sections.push(newSection);
    await config.save();

    res.status(201).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Add inspection section error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding section'
    });
  }
};

const addInspectionField = async (req, res) => {
  try {
    const config = await InspectionConfig.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // Find section across all categories
    let targetSection = null;
    for (const category of config.categories) {
      targetSection = category.sections.find(section => section.section_id === req.params.sectionId);
      if (targetSection) break;
    }

    if (!targetSection) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    const newField = {
      ...req.body,
      field_id: `field_${Date.now()}`
    };

    // Validate dropdown configuration if field type is dropdown
    if (newField.field_type === 'dropdown') {
      if (!newField.dropdown_config || !newField.dropdown_config.dropdown_name) {
        return res.status(400).json({
          success: false,
          message: 'Dropdown configuration is required for dropdown field type'
        });
      }

      // Verify that the dropdown exists and belongs to the company
      const dropdown = await DropdownMaster.findOne({
        dropdown_name: newField.dropdown_config.dropdown_name,
        company_id: req.user.company_id,
        is_active: true
      });

      if (!dropdown) {
        return res.status(400).json({
          success: false,
          message: 'Selected dropdown not found or inactive'
        });
      }

      // Set the dropdown_id reference
      newField.dropdown_config.dropdown_id = dropdown._id;
    }

    targetSection.fields.push(newField);
    await config.save();

    res.status(201).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Add inspection field error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding field'
    });
  }
};

// ... keep existing code (Trade-in Configuration Controllers)

const getTradeinConfigs = async (req, res) => {
  try {
    const configs = await TradeinConfig.find({
      company_id: req.user.company_id,
      is_active: true
    }).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      data: configs
    });

  } catch (error) {
    console.error('Get tradein configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving trade-in configurations'
    });
  }
};

const createTradeinConfig = async (req, res) => {
  try {
    const config = new TradeinConfig({
      ...req.body,
      company_id: req.user.company_id,
      created_by: req.user.id,
      sections: []
    });

    await config.save();

    res.status(201).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Create tradein config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating trade-in configuration'
    });
  }
};

const updateTradeinConfig = async (req, res) => {
  try {
    const config = await TradeinConfig.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.status(200).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Update tradein config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trade-in configuration'
    });
  }
};

const deleteTradeinConfig = async (req, res) => {
  try {
    const config = await TradeinConfig.findOneAndDelete({
      _id: req.params.id,
      company_id: req.user.company_id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Configuration deleted successfully'
    });

  } catch (error) {
    console.error('Delete tradein config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting trade-in configuration'
    });
  }
};

const addTradeinSection = async (req, res) => {
  try {
    const config = await TradeinConfig.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    const newSection = {
      ...req.body,
      section_id: `section_${Date.now()}`,
      fields: []
    };

    config.sections.push(newSection);
    await config.save();

    res.status(201).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Add tradein section error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding section'
    });
  }
};

const addTradeinField = async (req, res) => {
  try {
    const config = await TradeinConfig.findOne({
      _id: req.params.id,
      company_id: req.user.company_id
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    const section = config.sections.find(section => section.section_id === req.params.sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      });
    }

    const newField = {
      ...req.body,
      field_id: `field_${Date.now()}`
    };

    // Validate dropdown configuration if field type is dropdown
    if (newField.field_type === 'dropdown') {
      if (!newField.dropdown_config || !newField.dropdown_config.dropdown_name) {
        return res.status(400).json({
          success: false,
          message: 'Dropdown configuration is required for dropdown field type'
        });
      }

      // Verify that the dropdown exists and belongs to the company
      const dropdown = await DropdownMaster.findOne({
        dropdown_name: newField.dropdown_config.dropdown_name,
        company_id: req.user.company_id,
        is_active: true
      });

      if (!dropdown) {
        return res.status(400).json({
          success: false,
          message: 'Selected dropdown not found or inactive'
        });
      }

      // Set the dropdown_id reference
      newField.dropdown_config.dropdown_id = dropdown._id;
    }

    section.fields.push(newField);
    await config.save();

    res.status(201).json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Add tradein field error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding field'
    });
  }
};

module.exports = {
  getInspectionConfigs,
  getInspectionConfigDetails,
  createInspectionConfig,
  updateInspectionConfig,
  deleteInspectionConfig,
  addInspectionSection,
  addInspectionField,
  getTradeinConfigs,
  createTradeinConfig,
  updateTradeinConfig,
  deleteTradeinConfig,
  addTradeinSection,
  addTradeinField
};


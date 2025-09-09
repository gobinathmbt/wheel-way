const Vehicle = require('../models/Vehicle');
const { logEvent } = require('./logs.controller');

// @desc    Get all advertisement vehicles
// @route   GET /api/adpublishing
// @access  Private (Company Admin/Super Admin)
const getAdVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;

    let filter = { 
      company_id: req.user.company_id,
      vehicle_type: 'advertisement'
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { plate_no: { $regex: search, $options: 'i' } },
        { vin: { $regex: search, $options: 'i' } }
      ];
    }

    const adVehicles = await Vehicle.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vehicle.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: adVehicles,
      total,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get ad vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving advertisement vehicles'
    });
  }
};

// @desc    Get single advertisement vehicle
// @route   GET /api/adpublishing/:id
// @access  Private (Company Admin/Super Admin)
const getAdVehicle = async (req, res) => {
  try {
    const adVehicle = await Vehicle.findOne({
      vehicle_stock_id: req.params.id,
      company_id: req.user.company_id,
      vehicle_type: 'advertisement'
    });

    if (!adVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: adVehicle
    });

  } catch (error) {
    console.error('Get ad vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving advertisement vehicle'
    });
  }
};

// @desc    Create advertisement vehicle
// @route   POST /api/adpublishing
// @access  Private (Company Admin/Super Admin)
const createAdVehicle = async (req, res) => {
  try {
    const adVehicleData = {
      ...req.body,
      company_id: req.user.company_id,
      vehicle_type: 'advertisement'
    };

    const adVehicle = await Vehicle.create(adVehicleData);

    await logEvent({
      event_type: 'ad_publishing',
      event_action: 'ad_vehicle_created',
      event_description: `Advertisement vehicle created: ${adVehicle.make} ${adVehicle.model}`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: { vehicle_stock_id: adVehicle.vehicle_stock_id }
    });

    res.status(201).json({
      success: true,
      data: adVehicle,
      message: 'Advertisement vehicle created successfully'
    });

  } catch (error) {
    console.error('Create ad vehicle error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Advertisement vehicle with this stock ID already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating advertisement vehicle'
    });
  }
};

// @desc    Update advertisement vehicle
// @route   PUT /api/adpublishing/:id
// @access  Private (Company Admin/Super Admin)
const updateAdVehicle = async (req, res) => {
  try {
    const adVehicle = await Vehicle.findOneAndUpdate(
      { 
        vehicle_stock_id: req.params.id,
        company_id: req.user.company_id,
        vehicle_type: 'advertisement'
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!adVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement vehicle not found'
      });
    }

    await logEvent({
      event_type: 'ad_publishing',
      event_action: 'ad_vehicle_updated',
      event_description: `Advertisement vehicle updated: ${adVehicle.make} ${adVehicle.model}`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: { vehicle_stock_id: adVehicle.vehicle_stock_id }
    });

    res.status(200).json({
      success: true,
      data: adVehicle,
      message: 'Advertisement vehicle updated successfully'
    });

  } catch (error) {
    console.error('Update ad vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating advertisement vehicle'
    });
  }
};

// @desc    Delete advertisement vehicle
// @route   DELETE /api/adpublishing/:id
// @access  Private (Company Admin/Super Admin)
const deleteAdVehicle = async (req, res) => {
  try {
    const adVehicle = await Vehicle.findOneAndDelete({
      vehicle_stock_id: req.params.id,
      company_id: req.user.company_id,
      vehicle_type: 'advertisement'
    });

    if (!adVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement vehicle not found'
      });
    }

    await logEvent({
      event_type: 'ad_publishing',
      event_action: 'ad_vehicle_deleted',
      event_description: `Advertisement vehicle deleted: ${adVehicle.make} ${adVehicle.model}`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: { vehicle_stock_id: adVehicle.vehicle_stock_id }
    });

    res.status(200).json({
      success: true,
      message: 'Advertisement vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Delete ad vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting advertisement vehicle'
    });
  }
};

// @desc    Publish advertisement
// @route   POST /api/adpublishing/:id/publish
// @access  Private (Company Admin/Super Admin)
const publishAdVehicle = async (req, res) => {
  try {
    const adVehicle = await Vehicle.findOneAndUpdate(
      { 
        vehicle_stock_id: req.params.id,
        company_id: req.user.company_id,
        vehicle_type: 'advertisement'
      },
      { 
        status: 'published',
        published_at: new Date(),
        published_by: req.user.id
      },
      { new: true }
    );

    if (!adVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Advertisement vehicle not found'
      });
    }

    await logEvent({
      event_type: 'ad_publishing',
      event_action: 'ad_vehicle_published',
      event_description: `Advertisement published: ${adVehicle.make} ${adVehicle.model}`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: { vehicle_stock_id: adVehicle.vehicle_stock_id }
    });

    res.status(200).json({
      success: true,
      data: adVehicle,
      message: 'Advertisement published successfully'
    });

  } catch (error) {
    console.error('Publish ad vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing advertisement'
    });
  }
};

module.exports = {
  getAdVehicles,
  getAdVehicle,
  createAdVehicle,
  updateAdVehicle,
  deleteAdVehicle,
  publishAdVehicle
};
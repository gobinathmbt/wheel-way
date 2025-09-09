const MasterVehicle = require('../models/MasterVehicle');
const { logEvent } = require('./logs.controller');

// @desc    Get all master vehicles
// @route   GET /api/mastervehicle
// @access  Private (Company Admin/Super Admin)
const getMasterVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;

    let filter = { 
      company_id: req.user.company_id
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

    const masterVehicles = await MasterVehicle.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MasterVehicle.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: masterVehicles,
      total,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get master vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving master vehicles'
    });
  }
};

// @desc    Get single master vehicle
// @route   GET /api/mastervehicle/:id
// @access  Private (Company Admin/Super Admin)
const getMasterVehicle = async (req, res) => {
  try {
    const masterVehicle = await MasterVehicle.findOne({
      vehicle_stock_id: req.params.id,
      company_id: req.user.company_id
    });

    if (!masterVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Master vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: masterVehicle
    });

  } catch (error) {
    console.error('Get master vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving master vehicle'
    });
  }
};

// @desc    Create master vehicle
// @route   POST /api/mastervehicle
// @access  Private (Company Admin/Super Admin)
const createMasterVehicle = async (req, res) => {
  try {
    const masterVehicleData = {
      ...req.body,
      company_id: req.user.company_id
    };

    const masterVehicle = await MasterVehicle.create(masterVehicleData);

    await logEvent({
      event_type: 'master_vehicle',
      event_action: 'master_vehicle_created',
      event_description: `Master vehicle created: ${masterVehicle.make} ${masterVehicle.model}`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: { vehicle_stock_id: masterVehicle.vehicle_stock_id }
    });

    res.status(201).json({
      success: true,
      data: masterVehicle,
      message: 'Master vehicle created successfully'
    });

  } catch (error) {
    console.error('Create master vehicle error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Master vehicle with this stock ID already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating master vehicle'
    });
  }
};

// @desc    Update master vehicle
// @route   PUT /api/mastervehicle/:id
// @access  Private (Company Admin/Super Admin)
const updateMasterVehicle = async (req, res) => {
  try {
    const masterVehicle = await MasterVehicle.findOneAndUpdate(
      { 
        vehicle_stock_id: req.params.id,
        company_id: req.user.company_id
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!masterVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Master vehicle not found'
      });
    }

    await logEvent({
      event_type: 'master_vehicle',
      event_action: 'master_vehicle_updated',
      event_description: `Master vehicle updated: ${masterVehicle.make} ${masterVehicle.model}`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: { vehicle_stock_id: masterVehicle.vehicle_stock_id }
    });

    res.status(200).json({
      success: true,
      data: masterVehicle,
      message: 'Master vehicle updated successfully'
    });

  } catch (error) {
    console.error('Update master vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating master vehicle'
    });
  }
};

// @desc    Delete master vehicle
// @route   DELETE /api/mastervehicle/:id
// @access  Private (Company Admin/Super Admin)
const deleteMasterVehicle = async (req, res) => {
  try {
    const masterVehicle = await MasterVehicle.findOneAndDelete({
      vehicle_stock_id: req.params.id,
      company_id: req.user.company_id
    });

    if (!masterVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Master vehicle not found'
      });
    }

    await logEvent({
      event_type: 'master_vehicle',
      event_action: 'master_vehicle_deleted',
      event_description: `Master vehicle deleted: ${masterVehicle.make} ${masterVehicle.model}`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: { vehicle_stock_id: masterVehicle.vehicle_stock_id }
    });

    res.status(200).json({
      success: true,
      message: 'Master vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Delete master vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting master vehicle'
    });
  }
};

module.exports = {
  getMasterVehicles,
  getMasterVehicle,
  createMasterVehicle,
  updateMasterVehicle,
  deleteMasterVehicle
};
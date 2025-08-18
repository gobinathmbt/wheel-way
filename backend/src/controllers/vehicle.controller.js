
const Vehicle = require('../models/Vehicle');
const { logEvent } = require('./logs.controller');

// @desc    Get vehicle stock with pagination and filters
// @route   GET /api/vehicle/stock
// @access  Private (Company Admin/Super Admin)
const getVehicleStock = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      vehicle_type, 
      status 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    let filter = { company_id: req.user.company_id };
    
    if (vehicle_type) {
      filter.vehicle_type = vehicle_type;
    }
    
    if (status) {
      if (vehicle_type === 'inspection') {
        filter.inspection_status = status;
      } else if (vehicle_type === 'tradein') {
        filter.tradein_status = status;
      }
    }
    
    if (search) {
      filter.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { registration_number: { $regex: search, $options: 'i' } },
        { vin_number: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vehicle.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: vehicles,
      total,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get vehicle stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving vehicle stock'
    });
  }
};

// @desc    Get detailed vehicle information
// @route   GET /api/vehicle/detail/:vehicleId
// @access  Private (Company Admin/Super Admin)
const getVehicleDetail = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      vehicle_id: req.params.vehicleId,
      company_id: req.user.company_id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });

  } catch (error) {
    console.error('Get vehicle detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving vehicle details'
    });
  }
};

// @desc    Bulk import vehicles
// @route   POST /api/vehicle/bulk-import
// @access  Private (Company Admin/Super Admin)
const bulkImportVehicles = async (req, res) => {
  try {
    const { vehicles } = req.body;
    
    const processedVehicles = vehicles.map(vehicle => ({
      ...vehicle,
      company_id: req.user.company_id,
      created_by: req.user.id
    }));

    const result = await Vehicle.insertMany(processedVehicles, { ordered: false });

    await logEvent({
      event_type: 'vehicle_management',
      event_action: 'vehicles_imported',
      event_description: `${result.length} vehicles imported`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role
    });

    res.status(201).json({
      success: true,
      data: result,
      message: `${result.length} vehicles imported successfully`
    });

  } catch (error) {
    console.error('Bulk import vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing vehicles'
    });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicle/:id
// @access  Private (Company Admin/Super Admin)
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle'
    });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicle/:id
// @access  Private (Company Admin/Super Admin)
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({
      _id: req.params.id,
      company_id: req.user.company_id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle'
    });
  }
};

// @desc    Receive vehicle data from external sources
// @route   POST /api/vehicle/receive
// @access  Public (External systems)
const receiveVehicleData = async (req, res) => {
  try {
    const { vehicles, company_id } = req.body;
    
    // Process vehicles and add to queue for bulk processing
    // This would typically be handled by SQS or similar queue system
    
    const processedVehicles = [];
    
    for (const vehicleData of vehicles) {
      // Check if vehicle already exists
      const existingVehicle = await Vehicle.findOne({
        vehicle_id: vehicleData.vehicle_id,
        company_id
      });

      if (existingVehicle) {
        // Update existing vehicle
        Object.assign(existingVehicle, vehicleData);
        await existingVehicle.save();
        processedVehicles.push(existingVehicle);
      } else {
        // Create new vehicle
        const newVehicle = new Vehicle({
          ...vehicleData,
          company_id
        });
        await newVehicle.save();
        processedVehicles.push(newVehicle);
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${processedVehicles.length} vehicles`,
      data: processedVehicles.length
    });

  } catch (error) {
    console.error('Receive vehicle data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing vehicle data'
    });
  }
};

module.exports = {
  getVehicleStock,
  getVehicleDetail,
  bulkImportVehicles,
  updateVehicle,
  deleteVehicle,
  receiveVehicleData
};

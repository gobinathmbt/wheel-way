const Vehicle = require("../models/Vehicle");
const { logEvent } = require("./logs.controller");
const {
  processSingleVehicle,
  processBulkVehicles,
  validateRequiredFields,
  validateCompany,
} = require("./sqs.controller");

// @desc    Get vehicle stock with pagination and filters
// @route   GET /api/vehicle/stock
// @access  Private (Company Admin/Super Admin)
const getVehicleStock = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, vehicle_type, status } = req.query;

    const skip = (page - 1) * limit;

    let filter = { company_id: req.user.company_id };

    if (vehicle_type) {
      filter.vehicle_type = vehicle_type;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { make: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { plate_no: { $regex: search, $options: "i" } },
        { vin: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
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
        per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get vehicle stock error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving vehicle stock",
    });
  }
};

// @desc    Get detailed vehicle information
// @route   GET /api/vehicle/detail/:vehicleId
// @access  Private (Company Admin/Super Admin)
const getVehicleDetail = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      vehicle_stock_id: req.params.vehicleId,
      company_id: req.user.company_id,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Get vehicle detail error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving vehicle details",
    });
  }
};

// @desc    Bulk import vehicles
// @route   POST /api/vehicle/bulk-import
// @access  Private (Company Admin/Super Admin)
const bulkImportVehicles = async (req, res) => {
  try {
    const { vehicles } = req.body;

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vehicles array is required and cannot be empty",
      });
    }

    const results = await processBulkVehicles(vehicles, req.user.company_id);

    await logEvent({
      event_type: "vehicle_operation",
      event_action: "bulk_import_initiated",
      event_description: `Bulk import of ${vehicles.length} vehicles initiated`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: {
        total_vehicles: vehicles.length,
        success_count: results.success_records.length,
        failure_count: results.failure_records.length,
      },
    });

    res.status(200).json({
      success: true,
      message: `Processed ${results.total_processed} vehicles`,
      data: results,
    });
  } catch (error) {
    console.error("Bulk import vehicles error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing bulk import",
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
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("Update vehicle error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle",
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
      company_id: req.user.company_id,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting vehicle",
    });
  }
};

// @desc    Receive vehicle data from external sources
// @route   POST /api/vehicle/receive
// @access  Public (External systems)
const receiveVehicleData = async (req, res) => {
  try {
    const requestData = req.body;

    // Check if it's a single vehicle or bulk vehicles
    if (Array.isArray(requestData)) {
      // Bulk processing
      if (requestData.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Vehicle array cannot be empty",
        });
      }

      // Extract company_id from first vehicle (assuming all vehicles are for same company)
      const companyId = requestData[0].company_id;
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: "company_id is required",
        });
      }

      const results = await processBulkVehicles(requestData, companyId);

      res.status(200).json({
        success: true,
        message: `Processed ${results.total_processed} vehicles`,
        data: {
          total_processed: results.total_processed,
          success_count: results.success_records.length,
          failure_count: results.failure_records.length,
          queue_ids: results.queue_ids,
          success_records: results.success_records,
          failure_records: results.failure_records,
        },
      });
    } else {
      // Single vehicle processing
      if (!requestData.company_id) {
        return res.status(400).json({
          success: false,
          message: "company_id is required",
        });
      }

      const result = await processSingleVehicle(requestData);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "Vehicle data processed successfully",
          data: {
            vehicle_stock_id: result.vehicle_stock_id,
            queue_id: result.queue_id,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error,
          data: {
            vehicle_stock_id: result.vehicle_stock_id,
          },
        });
      }
    }
  } catch (error) {
    console.error("Receive vehicle data error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing vehicle data",
    });
  }
};

const processQueueManually = async (req, res) => {
  try {
    console.log("📋 Manual queue processing initiated by:", req.user.email);

    const result = await processQueueMessages();

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Queue processing completed`,
        data: {
          processed: result.processed,
          failed: result.failed,
          total: result.total || result.processed + result.failed,
          results: result.results || [],
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Queue processing failed",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Manual queue processing error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing queue manually",
    });
  }
};

module.exports = {
  getVehicleStock,
  getVehicleDetail,
  bulkImportVehicles,
  updateVehicle,
  deleteVehicle,
  receiveVehicleData,
  processQueueManually,
};

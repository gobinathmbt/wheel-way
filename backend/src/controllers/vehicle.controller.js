const Vehicle = require("../models/Vehicle");
const { logEvent } = require("./logs.controller");
const {
  processSingleVehicle,
  processBulkVehicles,
  validateRequiredFields,
  validateCompany,
  performBasicValidation,
  processQueueMessages,
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
          message: "company_id is required for all vehicles",
        });
      }

      // Perform basic validation on first vehicle to check company
      const firstVehicleValidation = await performBasicValidation(
        requestData[0]
      );
      if (
        !firstVehicleValidation.valid &&
        firstVehicleValidation.error.includes("Company")
      ) {
        return res.status(400).json({
          success: false,
          message: firstVehicleValidation.error,
        });
      }

      console.log(`🔄 Processing bulk vehicles for company: ${companyId}`);
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

      if (!requestData.vehicle_type) {
        return res.status(400).json({
          success: false,
          message: "vehicle_type is required (inspection or tradein)",
        });
      }

      if (!requestData.vehicle_stock_id) {
        return res.status(400).json({
          success: false,
          message: "vehicle_stock_id is required",
        });
      }

      console.log(
        `🔍 Processing single vehicle: ${requestData.vehicle_stock_id} - ${requestData.vehicle_type} for company: ${requestData.company_id}`
      );

      // Perform basic validation first
      const validation = await performBasicValidation(requestData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
          data: {
            vehicle_stock_id: requestData.vehicle_stock_id,
          },
        });
      }

      const result = await processSingleVehicle(requestData);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.exists
            ? "Vehicle data updated and queued for processing"
            : "Vehicle data received and queued for processing",
          data: {
            vehicle_stock_id: result.vehicle_stock_id,
            queue_id: result.queue_id,
            exists: result.exists,
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
      error: error.message,
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

// @desc    Update vehicle overview section
// @route   PUT /api/vehicle/:id/overview
// @access  Private (Company Admin/Super Admin)
const updateVehicleOverview = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      {
        make: req.body.make,
        model: req.body.model,
        variant: req.body.variant,
        year: req.body.year,
        vin: req.body.vin,
        plate_no: req.body.plate_no,
        chassis_no: req.body.chassis_no,
        body_style: req.body.body_style,
        vehicle_category: req.body.vehicle_category,
      },
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
    console.error("Update vehicle overview error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle overview",
    });
  }
};

// @desc    Update vehicle general info section
// @route   PUT /api/vehicle/:id/general-info
// @access  Private (Company Admin/Super Admin)
const updateVehicleGeneralInfo = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { vehicle_other_details: req.body.vehicle_other_details },
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
    console.error("Update vehicle general info error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle general info",
    });
  }
};

// @desc    Update vehicle source section
// @route   PUT /api/vehicle/:id/source
// @access  Private (Company Admin/Super Admin)
const updateVehicleSource = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { vehicle_source: req.body.vehicle_source },
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
    console.error("Update vehicle source error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle source",
    });
  }
};

// @desc    Update vehicle registration section
// @route   PUT /api/vehicle/:id/registration
// @access  Private (Company Admin/Super Admin)
const updateVehicleRegistration = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { vehicle_registration: req.body.vehicle_registration },
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
    console.error("Update vehicle registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle registration",
    });
  }
};

// @desc    Update vehicle import section
// @route   PUT /api/vehicle/:id/import
// @access  Private (Company Admin/Super Admin)
const updateVehicleImport = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { vehicle_import_details: req.body.vehicle_import_details },
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
    console.error("Update vehicle import error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle import details",
    });
  }
};

// @desc    Update vehicle engine section
// @route   PUT /api/vehicle/:id/engine
// @access  Private (Company Admin/Super Admin)
const updateVehicleEngine = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { vehicle_eng_transmission: req.body.vehicle_eng_transmission },
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
    console.error("Update vehicle engine error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle engine details",
    });
  }
};

// @desc    Update vehicle specifications section
// @route   PUT /api/vehicle/:id/specifications
// @access  Private (Company Admin/Super Admin)
const updateVehicleSpecifications = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { vehicle_specifications: req.body.vehicle_specifications },
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
    console.error("Update vehicle specifications error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle specifications",
    });
  }
};

// @desc    Update vehicle safety features section
// @route   PUT /api/vehicle/:id/safety
// @access  Private (Company Admin/Super Admin)
const updateVehicleSafetyFeatures = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { vehicle_safety_features: req.body.vehicle_safety_features },
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
    console.error("Update vehicle safety features error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle safety features",
    });
  }
};

// @desc    Update vehicle odometer section
// @route   PUT /api/vehicle/:id/odometer
// @access  Private (Company Admin/Super Admin)
const updateVehicleOdometer = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { vehicle_odometer: req.body.vehicle_odometer },
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
    console.error("Update vehicle odometer error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle odometer",
    });
  }
};

// @desc    Update vehicle ownership section
// @route   PUT /api/vehicle/:id/ownership
// @access  Private (Company Admin/Super Admin)
const updateVehicleOwnership = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { vehicle_ownership: req.body.vehicle_ownership },
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
    console.error("Update vehicle ownership error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle ownership",
    });
  }
};

// @desc    Get vehicle attachments
// @route   GET /api/vehicle/:id/attachments
// @access  Private (Company Admin/Super Admin)
const getVehicleAttachments = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
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
      data: vehicle.vehicle_attachments || [],
    });
  } catch (error) {
    console.error("Get vehicle attachments error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving vehicle attachments",
    });
  }
};

// @desc    Upload vehicle attachment
// @route   POST /api/vehicle/:id/attachments
// @access  Private (Company Admin/Super Admin)
const uploadVehicleAttachment = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      company_id: req.user.company_id,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Add the new attachment
    vehicle.vehicle_attachments = vehicle.vehicle_attachments || [];
    vehicle.vehicle_attachments.push(req.body);

    await vehicle.save();

    res.status(200).json({
      success: true,
      data: vehicle.vehicle_attachments,
    });
  } catch (error) {
    console.error("Upload vehicle attachment error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading vehicle attachment",
    });
  }
};

// @desc    Delete vehicle attachment
// @route   DELETE /api/vehicle/:id/attachments/:attachmentId
// @access  Private (Company Admin/Super Admin)
const deleteVehicleAttachment = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      company_id: req.user.company_id,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Remove the attachment
    vehicle.vehicle_attachments = vehicle.vehicle_attachments.filter(
      attachment => attachment._id.toString() !== req.params.attachmentId
    );

    await vehicle.save();

    res.status(200).json({
      success: true,
      data: vehicle.vehicle_attachments,
    });
  } catch (error) {
    console.error("Delete vehicle attachment error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting vehicle attachment",
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
  
  // New section update exports
  updateVehicleOverview,
  updateVehicleGeneralInfo,
  updateVehicleSource,
  updateVehicleRegistration,
  updateVehicleImport,
  updateVehicleEngine,
  updateVehicleSpecifications,
  updateVehicleSafetyFeatures,
  updateVehicleOdometer,
  updateVehicleOwnership,
  getVehicleAttachments,
  uploadVehicleAttachment,
  deleteVehicleAttachment,
};

const Vehicle = require("../models/Vehicle");
const AdvertiseVehicle = require("../models/AdvertiseVehicle");
const MasterVehicle = require("../models/MasterVehicle");
const { logEvent } = require("./logs.controller");

// Helper function to get the correct model based on vehicle type
const getVehicleModel = (vehicleType) => {
  switch (vehicleType) {
    case "advertisement":
      return AdvertiseVehicle;
    case "master":
      return MasterVehicle;
    case "inspection":
    case "tradein":
    default:
      return Vehicle;
  }
};

// @desc    Update dealership for single or multiple vehicles
// @route   PUT /api/common-vehicle/update-dealership
// @access  Private (Company Admin/Super Admin)
const updateVehicleDealership = async (req, res) => {
  try {
    const { vehicleIds, dealershipId, vehicleType } = req.body;

    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vehicle IDs array is required",
      });
    }

    if (!dealershipId) {
      return res.status(400).json({
        success: false,
        message: "Dealership ID is required",
      });
    }

    if (!vehicleType) {
      return res.status(400).json({
        success: false,
        message: "Vehicle type is required",
      });
    }

    // Get the correct model based on vehicle type
    const VehicleModel = getVehicleModel(vehicleType);

    // Update dealership for all vehicles
    const result = await VehicleModel.updateMany(
      {
        _id: { $in: vehicleIds },
        company_id: req.user.company_id,
      },
      {
        dealership_id: dealershipId,
        updated_at: new Date(),
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No vehicles found or updated",
      });
    }

    // Log the event
    await logEvent({
      event_type: "vehicle_operation",
      event_action: "bulk_dealership_update",
      event_description: `Updated dealership for ${result.modifiedCount} vehicles to ${dealershipId}`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: {
        vehicle_ids: vehicleIds,
        dealership_id: dealershipId,
        vehicle_type: vehicleType,
        updated_count: result.modifiedCount,
      },
    });

    res.status(200).json({
      success: true,
      message: `Successfully updated dealership for ${result.modifiedCount} vehicles`,
      data: {
        updated_count: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Update vehicle dealership error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating vehicle dealership",
    });
  }
};

// @desc    Get vehicles for bulk operations with pagination and filters
// @route   GET /api/common-vehicle/bulk-operations
// @access  Private (Company Admin/Super Admin)
const getVehiclesForBulkOperations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      vehicle_type,
      status,
      dealership_id,
    } = req.query;

    const skip = (page - 1) * limit;
    const numericLimit = parseInt(limit);
    const numericPage = parseInt(page);

    // Validate vehicle type
    if (!vehicle_type) {
      return res.status(400).json({
        success: false,
        message: "Vehicle type is required",
      });
    }

    // Get the correct model based on vehicle type
    const VehicleModel = getVehicleModel(vehicle_type);

    // Build filter with company_id first for index usage
    let filter = { company_id: req.user.company_id };

    // Handle dealership-based access for non-primary company_super_admin
    if (!req.user.is_primary_admin && req.user.dealership_ids && req.user.dealership_ids.length > 0) {
      const dealershipObjectIds = req.user.dealership_ids.map(dealer => 
        typeof dealer === "object" ? dealer._id : dealer
      );
      filter.dealership_id = { $in: dealershipObjectIds };
    }

    if (dealership_id && dealership_id !== "all") {
      filter.dealership_id = dealership_id;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    // Use text search if available, otherwise use regex fallback
    if (search) {
      if (search.trim().length > 0) {
        filter.$text = { $search: search };
      }
    }

    // Define the fields to return
    const fields = {
      vehicle_stock_id: 1,
      make: 1,
      model: 1,
      year: 1,
      variant: 1,
      plate_no: 1,
      vin: 1,
      vehicle_type: 1,
      status: 1,
      dealership_id: 1,
      vehicle_hero_image: 1,
      created_at: 1,
    };

    // Use parallel execution for count and data retrieval
    const [vehicles, total] = await Promise.all([
      VehicleModel.find(filter, fields)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      VehicleModel.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: vehicles,
      total,
      pagination: {
        current_page: numericPage,
        total_pages: Math.ceil(total / numericLimit),
        total_records: total,
        per_page: numericLimit,
      },
    });
  } catch (error) {
    console.error("Get vehicles for bulk operations error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving vehicles for bulk operations",
    });
  }
};

module.exports = {
  updateVehicleDealership,
  getVehiclesForBulkOperations,
};
const Vehicle = require("../models/Vehicle");
const WorkshopQuote = require("../models/WorkshopQuote");
const Supplier = require("../models/Supplier");
const { logEvent } = require("./logs.controller");

// @desc    Get vehicles with inspection results for workshop
// @route   GET /api/workshop/vehicles
// @access  Private (Company Admin/Super Admin)
const getWorkshopVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, vehicle_type } = req.query;
    const skip = (page - 1) * limit;

    let filter = { 
      company_id: req.user.company_id,
      inspection_result: { $exists: true, $ne: [] }
    };

    if (vehicle_type) {
      filter.vehicle_type = vehicle_type;
    }

    if (search) {
      filter.$or = [
        { make: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { plate_no: { $regex: search, $options: "i" } },
        { vin: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } }
      ];
    }

    const vehicles = await Vehicle.find(filter)
      .select('vehicle_stock_id make model year plate_no vehicle_type vin name vehicle_hero_image inspection_result created_at')
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
    console.error("Get workshop vehicles error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving workshop vehicles"
    });
  }
};

// @desc    Get vehicle details for workshop config
// @route   GET /api/workshop/vehicle/:vehicleId
// @access  Private (Company Admin/Super Admin)
const getWorkshopVehicleDetails = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      vehicle_stock_id: req.params.vehicleId,
      vehicle_type: req.params.vehicleType,
      company_id: req.user.company_id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error("Get workshop vehicle details error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving vehicle details"
    });
  }
};

// @desc    Create quote for inspection field
// @route   POST /api/workshop/quote
// @access  Private (Company Admin/Super Admin)
const createQuote = async (req, res) => {
  try {
    const {
      vehicle_type,
      vehicle_stock_id,
      field_id,
      field_name,
      quote_amount,
      quote_description,
      selected_suppliers
    } = req.body;

    // Validate required fields
    if (!vehicle_type || !vehicle_stock_id || !field_id || !quote_amount || !selected_suppliers || !selected_suppliers.length) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // Check if quote already exists for this field
    const existingQuote = await WorkshopQuote.findOne({
      vehicle_type,
      company_id: req.user.company_id,
      vehicle_stock_id,
      field_id
    });

    if (existingQuote) {
      return res.status(400).json({
        success: false,
        message: "Quote already exists for this field"
      });
    }

    // Verify suppliers exist and belong to company
    const suppliers = await Supplier.find({
      _id: { $in: selected_suppliers },
      company_id: req.user.company_id,
      is_active: true
    });

    if (suppliers.length !== selected_suppliers.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected suppliers are invalid"
      });
    }

    const quote = new WorkshopQuote({
      vehicle_type,
      company_id: req.user.company_id,
      vehicle_stock_id,
      field_id,
      field_name,
      quote_amount,
      quote_description,
      selected_suppliers,
      created_by: req.user.id
    });

    await quote.save();

    // TODO: Send email notifications to suppliers
    // This would require email service integration

    // Log the event
    await logEvent({
      event_type: "workshop_operation",
      event_action: "quote_created",
      event_description: `Quote created for field ${field_name} on vehicle ${vehicle_stock_id}`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: {
        quote_id: quote._id,
        vehicle_stock_id,
        field_id,
        field_name,
        quote_amount,
        supplier_count: selected_suppliers.length
      }
    });

    res.status(201).json({
      success: true,
      message: "Quote created and sent to suppliers",
      data: quote
    });
  } catch (error) {
    console.error("Create quote error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating quote"
    });
  }
};

// @desc    Get quotes for a vehicle field
// @route   GET /api/workshop/quotes/:vehicle_type/:vehicle_stock_id/:field_id
// @access  Private (Company Admin/Super Admin)
const getQuotesForField = async (req, res) => {
  try {
    const { vehicle_type, vehicle_stock_id, field_id } = req.params;
console.log(vehicle_type, vehicle_stock_id, field_id);
    const quote = await WorkshopQuote.findOne({
      vehicle_type,
      company_id: req.user.company_id,
      vehicle_stock_id: parseInt(vehicle_stock_id),
      field_id
    })
    .populate('selected_suppliers', 'name email supplier_shop_name')
    .populate('approved_supplier', 'name email supplier_shop_name')
    .populate('supplier_responses.supplier_id', 'name email supplier_shop_name');

    res.status(200).json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error("Get quotes for field error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving quotes"
    });
  }
};

// @desc    Approve supplier quote
// @route   POST /api/workshop/quote/:quoteId/approve/:supplierId
// @access  Private (Company Admin/Super Admin)
const approveSupplierQuote = async (req, res) => {
  try {
    const { quoteId, supplierId } = req.params;

    const quote = await WorkshopQuote.findOne({
      _id: quoteId,
      company_id: req.user.company_id
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Quote not found"
      });
    }

    // Check if supplier response exists
    const supplierResponse = quote.supplier_responses.find(
      response => response.supplier_id.toString() === supplierId
    );

    if (!supplierResponse) {
      return res.status(404).json({
        success: false,
        message: "Supplier response not found"
      });
    }

    // Update quote status and approve supplier
    quote.status = 'completed';
    quote.approved_supplier = supplierId;
    quote.approved_at = new Date();

    // Update all responses status
    quote.supplier_responses.forEach(response => {
      if (response.supplier_id.toString() === supplierId) {
        response.status = 'approved';
      } else {
        response.status = 'rejected';
      }
    });

    await quote.save();

    // TODO: Send email notifications to all suppliers
    // Approved supplier gets approval email
    // Rejected suppliers get rejection email

    // Log the event
    await logEvent({
      event_type: "workshop_operation",
      event_action: "quote_approved",
      event_description: `Quote approved for supplier on vehicle ${quote.vehicle_stock_id}`,
      user_id: req.user.id,
      company_id: req.user.company_id,
      user_role: req.user.role,
      metadata: {
        quote_id: quote._id,
        approved_supplier: supplierId,
        vehicle_stock_id: quote.vehicle_stock_id,
        field_id: quote.field_id
      }
    });

    res.status(200).json({
      success: true,
      message: "Supplier quote approved successfully",
      data: quote
    });
  } catch (error) {
    console.error("Approve supplier quote error:", error);
    res.status(500).json({
      success: false,
      message: "Error approving supplier quote"
    });
  }
};

module.exports = {
  getWorkshopVehicles,
  getWorkshopVehicleDetails,
  createQuote,
  getQuotesForField,
  approveSupplierQuote
};
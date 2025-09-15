const Make = require("../models/Make");
const Model = require("../models/Model");
const Body = require("../models/Body");
const VariantYear = require("../models/VariantYear");
const VehicleMetadata = require("../models/VehicleMetadata");
const { GlobalLog } = require("../models/GlobalLog");

// Helper function to create/update makes, models, bodies, and years
const createOrUpdateEntry = async (Model, findCriteria, data) => {
  try {
    const existing = await Model.findOne(findCriteria);
    if (existing) {
      Object.assign(existing, data);
      await existing.save();
      return existing;
    } else {
      return await Model.create(data);
    }
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, try to find and return existing
      return await Model.findOne(findCriteria);
    }
    throw error;
  }
};

// Get all makes
exports.getMakes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", isActive } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { displayValue: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const makes = await Make.find(filter)
      .sort({ displayName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Make.countDocuments(filter);

    res.json({
      success: true,
      data: makes,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching makes",
      error: error.message,
    });
  }
};

// Get all models
exports.getModels = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", isActive } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { displayValue: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const models = await Model.find(filter)
      .populate("make", "displayName displayValue")
      .sort({ displayName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Model.countDocuments(filter);

    res.json({
      success: true,
      data: models,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching models",
      error: error.message,
    });
  }
};

// Get models by make
exports.getModelsByMake = async (req, res) => {
  try {
    const { makeId } = req.params;
    const { page = 1, limit = 10, search = "", isActive } = req.query;
    const skip = (page - 1) * limit;

    const filter = { make: makeId };
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { displayValue: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const models = await Model.find(filter)
      .populate("make", "displayName displayValue")
      .sort({ displayName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Model.countDocuments(filter);

    res.json({
      success: true,
      data: models,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching models",
      error: error.message,
    });
  }
};

// Get all bodies
exports.getBodies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", isActive } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { displayValue: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const bodies = await Body.find(filter)
      .sort({ displayName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Body.countDocuments(filter);

    res.json({
      success: true,
      data: bodies,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bodies",
      error: error.message,
    });
  }
};

// Get all variant years
exports.getVariantYears = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", isActive } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { displayValue: { $regex: search, $options: "i" } },
        { year: parseInt(search) || 0 },
      ];
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const variantYears = await VariantYear.find(filter)
      .sort({ year: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VariantYear.countDocuments(filter);

    res.json({
      success: true,
      data: variantYears,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching variant years",
      error: error.message,
    });
  }
};

// Get vehicle metadata combinations
exports.getVehicleMetadata = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      make,
      model,
      body,
      variantYear,
      fuelType,
      transmission,
    } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (make) filter.make = make;
    if (model) filter.model = model;
    if (body) filter.body = body;
    if (variantYear) filter.variantYear = variantYear;
    if (fuelType) filter.fuelType = { $regex: fuelType, $options: "i" };
    if (transmission)
      filter.transmission = { $regex: transmission, $options: "i" };

    const metadata = await VehicleMetadata.find(filter)
      .populate("make", "displayName displayValue")
      .populate("model", "displayName displayValue")
      .populate("body", "displayName displayValue")
      .populate("variantYear", "displayName displayValue year")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VehicleMetadata.countDocuments(filter);

    res.json({
      success: true,
      data: metadata,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vehicle metadata",
      error: error.message,
    });
  }
};

// Get counts for dashboard
exports.getCounts = async (req, res) => {
  try {
    const [makesCount, modelsCount, bodiesCount, yearsCount, metadataCount] =
      await Promise.all([
        Make.countDocuments({ isActive: true }),
        Model.countDocuments({ isActive: true }),
        Body.countDocuments({ isActive: true }),
        VariantYear.countDocuments({ isActive: true }),
        VehicleMetadata.countDocuments({ isActive: true }),
      ]);

    res.json({
      success: true,
      data: {
        makes: makesCount,
        models: modelsCount,
        bodies: bodiesCount,
        years: yearsCount,
        metadata: metadataCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching counts",
      error: error.message,
    });
  }
};

// Get optimized dropdown data
exports.getDropdownData = async (req, res) => {
  try {
    const { type, makeId, modelId } = req.query;

    let data = {};

    switch (type) {
      case "makes":
        data = await Make.find({ isActive: true })
          .select("_id displayName displayValue")
          .sort({ displayName: 1 });
        break;

      case "models":
        if (!makeId) {
          return res.status(400).json({
            success: false,
            message: "makeId is required for models",
          });
        }
        data = await Model.find({ make: makeId, isActive: true })
          .select("_id displayName displayValue")
          .sort({ displayName: 1 });
        break;

      case "bodies":
        data = await Body.find({ isActive: true })
          .select("_id displayName displayValue")
          .sort({ displayName: 1 });
        break;

      case "years":
        data = await VariantYear.find({ isActive: true })
          .select("_id displayName displayValue year")
          .sort({ year: -1 });
        break;

      case "fuel-types":
        data = await VehicleMetadata.distinct("fuelType", {
          fuelType: { $ne: null },
        });
        break;

      case "transmissions":
        data = await VehicleMetadata.distinct("transmission", {
          transmission: { $ne: null },
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid type specified",
        });
    }

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dropdown data",
      error: error.message,
    });
  }
};

// Add individual entries
exports.addMake = async (req, res) => {
  try {
    console.log(req.body);
    const { displayName } = req.body;

    if (!displayName) {
      return res.status(400).json({
        success: false,
        message: "Display name is required",
      });
    }

    const make = await createOrUpdateEntry(
      Make,
      { displayValue: displayName.toLowerCase().trim().replace(/\s+/g, "_") },
      { displayName }
    );

    res.json({
      success: true,
      data: make,
      message: "Make added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding make",
      error: error.message,
    });
  }
};

exports.addModel = async (req, res) => {
  try {
    const { displayName, makeId } = req.body;

    if (!displayName || !makeId) {
      return res.status(400).json({
        success: false,
        message: "Display name and make ID are required",
      });
    }

    const model = await createOrUpdateEntry(
      Model,
      {
        make: makeId,
        displayValue: displayName.toLowerCase().trim().replace(/\s+/g, "_"),
      },
      { displayName, make: makeId }
    );

    await model.populate("make", "displayName displayValue");

    res.json({
      success: true,
      data: model,
      message: "Model added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding model",
      error: error.message,
    });
  }
};

exports.addBody = async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName) {
      return res.status(400).json({
        success: false,
        message: "Display name is required",
      });
    }

    const body = await createOrUpdateEntry(
      Body,
      { displayValue: displayName.toLowerCase().trim().replace(/\s+/g, "_") },
      { displayName }
    );

    res.json({
      success: true,
      data: body,
      message: "Body added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding body",
      error: error.message,
    });
  }
};

exports.addVariantYear = async (req, res) => {
  try {
    const { year, displayName } = req.body;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Year is required",
      });
    }

    const yearInt = parseInt(year);
    if (
      isNaN(yearInt) ||
      yearInt < 1900 ||
      yearInt > new Date().getFullYear() + 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid year provided",
      });
    }

    const variantYear = await createOrUpdateEntry(
      VariantYear,
      { year: yearInt },
      {
        year: yearInt,
        displayName: displayName || yearInt.toString(),
      }
    );

    res.json({
      success: true,
      data: variantYear,
      message: "Variant year added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding variant year",
      error: error.message,
    });
  }
};

exports.addVehicleMetadata = async (req, res) => {
  try {
    const vehicleMetadata = await VehicleMetadata.create(req.body);
    await vehicleMetadata.populate([
      { path: "make", select: "displayName displayValue" },
      { path: "model", select: "displayName displayValue" },
      { path: "body", select: "displayName displayValue" },
      { path: "variantYear", select: "displayName displayValue year" },
    ]);

    res.json({
      success: true,
      data: vehicleMetadata,
      message: "Vehicle metadata added successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding vehicle metadata",
      error: error.message,
    });
  }
};

// Update entries
exports.updateMake = async (req, res) => {
  try {
    const { id } = req.params;
    const make = await Make.findByIdAndUpdate(id, req.body, { new: true });

    if (!make) {
      return res.status(404).json({
        success: false,
        message: "Make not found",
      });
    }

    res.json({
      success: true,
      data: make,
      message: "Make updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating make",
      error: error.message,
    });
  }
};

exports.updateModel = async (req, res) => {
  try {
    const { id } = req.params;
    const model = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
    }).populate("make", "displayName displayValue");

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    res.json({
      success: true,
      data: model,
      message: "Model updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating model",
      error: error.message,
    });
  }
};

exports.updateBody = async (req, res) => {
  try {
    const { id } = req.params;
    const body = await Body.findByIdAndUpdate(id, req.body, { new: true });

    if (!body) {
      return res.status(404).json({
        success: false,
        message: "Body not found",
      });
    }

    res.json({
      success: true,
      data: body,
      message: "Body updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating body",
      error: error.message,
    });
  }
};

exports.updateVariantYear = async (req, res) => {
  try {
    const { id } = req.params;
    const variantYear = await VariantYear.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!variantYear) {
      return res.status(404).json({
        success: false,
        message: "Variant year not found",
      });
    }

    res.json({
      success: true,
      data: variantYear,
      message: "Variant year updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating variant year",
      error: error.message,
    });
  }
};

exports.updateVehicleMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicleMetadata = await VehicleMetadata.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    ).populate([
      { path: "make", select: "displayName displayValue" },
      { path: "model", select: "displayName displayValue" },
      { path: "body", select: "displayName displayValue" },
      { path: "variantYear", select: "displayName displayValue year" },
    ]);

    if (!vehicleMetadata) {
      return res.status(404).json({
        success: false,
        message: "Vehicle metadata not found",
      });
    }

    res.json({
      success: true,
      data: vehicleMetadata,
      message: "Vehicle metadata updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating vehicle metadata",
      error: error.message,
    });
  }
};

// Delete entries
exports.deleteMake = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if make is being used
    const modelsCount = await Model.countDocuments({ make: id });
    const metadataCount = await VehicleMetadata.countDocuments({ make: id });

    if (modelsCount > 0 || metadataCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete make as it is being used in models or vehicle metadata",
      });
    }

    const make = await Make.findByIdAndDelete(id);

    if (!make) {
      return res.status(404).json({
        success: false,
        message: "Make not found",
      });
    }

    res.json({
      success: true,
      message: "Make deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting make",
      error: error.message,
    });
  }
};

exports.deleteModel = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if model is being used
    const metadataCount = await VehicleMetadata.countDocuments({ model: id });

    if (metadataCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete model as it is being used in vehicle metadata",
      });
    }

    const model = await Model.findByIdAndDelete(id);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    res.json({
      success: true,
      message: "Model deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting model",
      error: error.message,
    });
  }
};

exports.deleteBody = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if body is being used
    const metadataCount = await VehicleMetadata.countDocuments({ body: id });

    if (metadataCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete body as it is being used in vehicle metadata",
      });
    }

    const body = await Body.findByIdAndDelete(id);

    if (!body) {
      return res.status(404).json({
        success: false,
        message: "Body not found",
      });
    }

    res.json({
      success: true,
      message: "Body deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting body",
      error: error.message,
    });
  }
};

exports.deleteVariantYear = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if variant year is being used
    const metadataCount = await VehicleMetadata.countDocuments({
      variantYear: id,
    });

    if (metadataCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete variant year as it is being used in vehicle metadata",
      });
    }

    const variantYear = await VariantYear.findByIdAndDelete(id);

    if (!variantYear) {
      return res.status(404).json({
        success: false,
        message: "Variant year not found",
      });
    }

    res.json({
      success: true,
      message: "Variant year deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting variant year",
      error: error.message,
    });
  }
};

exports.getSchemaFields = async (req, res) => {
  try {
    const schemaFields = {
      required: [
        {
          name: "make",
          type: "String",
          description: "Vehicle make/manufacturer (e.g., Toyota, Honda)",
        },
        {
          name: "model",
          type: "String",
          description: "Vehicle model (e.g., Camry, Civic)",
        },
      ],
      optional: [
        {
          name: "variant",
          type: "String",
          description:
            "Specific version or trim level of a vehicle model (e.g., Sport, Limited, VXi, Base).",
        },
        {
          name: "body",
          type: "String",
          description: "Body type (sedan, suv, hatchback, convertible, etc.)",
        },
        {
          name: "year",
          type: "Integer",
          description: "Manufacturing year (1900-2026)",
        },
        {
          name: "fuelType",
          type: "String",
          description: "Fuel type (petrol, diesel, electric, hybrid, etc.)",
        },
        {
          name: "transmission",
          type: "String",
          description: "Transmission type (manual, automatic, cvt, etc.)",
        },
        {
          name: "engineCapacity",
          type: "String",
          description: "Engine capacity/displacement (e.g., 2.0L, 1600cc)",
        },
        {
          name: "power",
          type: "String",
          description: "Engine power output (e.g., 200hp, 150kW)",
        },
        {
          name: "torque",
          type: "String",
          description: "Engine torque (e.g., 300Nm, 250 lb-ft)",
        },
        {
          name: "seatingCapacity",
          type: "Integer",
          description: "Number of seats (2-50)",
        },
      ],
      dataTypes: ["String", "Integer", "Number", "Boolean", "Date"],
      examples: {
        make: ["Toyota", "Honda", "BMW", "Mercedes-Benz"],
        model: ["Camry", "Civic", "X3", "C-Class"],
        body: ["Sedan", "SUV", "Hatchback", "Coupe"],
        fuelType: ["Petrol", "Diesel", "Electric", "Hybrid"],
        transmission: ["Manual", "Automatic", "CVT", "AMT"],
      },
    };

    res.json({
      success: true,
      data: schemaFields,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching schema fields",
      error: error.message,
    });
  }
};

exports.deleteVehicleMetadata = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicleMetadata = await VehicleMetadata.findByIdAndDelete(id);

    if (!vehicleMetadata) {
      return res.status(404).json({
        success: false,
        message: "Vehicle metadata not found",
      });
    }

    res.json({
      success: true,
      message: "Vehicle metadata deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting vehicle metadata",
      error: error.message,
    });
  }
};

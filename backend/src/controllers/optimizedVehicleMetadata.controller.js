const Make = require("../models/Make");
const Model = require("../models/Model");
const Body = require("../models/Body");
const VariantYear = require("../models/VariantYear");
const VehicleMetadata = require("../models/VehicleMetadata");
const { logEvent } = require("./logs.controller");
const XLSX = require("xlsx");
const { v4: uuidv4 } = require("uuid");

// Batch processing configuration
const BATCH_SIZE = 100; // Process 1000 records at a time
const MAX_CONCURRENT_OPERATIONS = 3;

// Data type conversion helpers
const convertToType = (value, targetType, fieldName) => {
  if (value === null || value === undefined || value === "") return null;

  try {
    switch (targetType) {
      case "Number":
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      case "Integer":
        const int = parseInt(value);
        return isNaN(int) ? null : int;
      case "Boolean":
        if (typeof value === "boolean") return value;
        return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
      case "String":
        return String(value).trim();
      case "Date":
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      default:
        return value;
    }
  } catch (error) {
    console.warn(
      `Failed to convert ${fieldName}: ${value} to ${targetType}`,
      error
    );
    return null;
  }
};

// Enhanced create/update helper
const createOrUpdateEntry = async (Model, findCriteria, data, options = {}) => {
  try {
    const session = options.session;

    const existing = await Model.findOne(findCriteria).session(session);
    if (existing) {
      if (options.updateExisting !== false) {
        Object.assign(existing, data);
        await existing.save({ session });
      }
      return existing;
    }

    const newEntry = new Model(data);
    await newEntry.save({ session });
    return newEntry;
  } catch (error) {
    if (error.code === 11000) {
      const existing = await Model.findOne(findCriteria).session(
        options.session
      );
      if (existing) return existing;
    }
    throw error;
  }
};

// Optimized bulk upload with proper batch processing
exports.bulkUploadMetadata = async (req, res) => {
  const session = await VehicleMetadata.startSession();

  try {
    await session.withTransaction(async () => {
      const {
        data,
        fieldMapping,
        dataTypes,
        customFieldTypes,
        options = {},
      } = req.body;

      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid data provided");
      }

      const batchId = uuidv4();
      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        batchId,
        totalBatches: Math.ceil(data.length / BATCH_SIZE),
        currentBatch: 0,
      };

      // Process data in batches
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

        console.log(
          `Processing batch ${batchNumber}/${results.totalBatches} (${batch.length} records)`
        );

        const batchResults = await processBatch(
          batch,
          fieldMapping,
          dataTypes,
          customFieldTypes,
          {
            ...options,
            batchId,
            session,
            user: req.user,
            batchNumber,
            totalBatches: results.totalBatches,
          }
        );

        // Accumulate results
        results.processed += batchResults.processed;
        results.created += batchResults.created;
        results.updated += batchResults.updated;
        results.skipped += batchResults.skipped;
        results.errors.push(...batchResults.errors);
        results.currentBatch = batchNumber;

        // Send progress update (you can implement WebSocket here)
        console.log(
          `Completed batch ${batchNumber}/${
            results.totalBatches
          } - Progress: ${((batchNumber / results.totalBatches) * 100).toFixed(
            1
          )}%`
        );
      }

      await logEvent({
        event_type: "meta_operation",
        event_action: "meta_operation",
        event_description:
          "Bulk uploaded ${results.processed} vehicle metadata entries in ${results.totalBatches} batches",
        user_id: req.user.id,
        user_role: req.user.role,
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Bulk upload completed successfully",
        data: results,
      });
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      success: false,
      message: "Error during bulk upload",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
};

// Process a single batch with progress tracking
const processBatch = async (
  batch,
  fieldMapping,
  dataTypes,
  customFieldTypes,
  options
) => {
  const { batchId, session, user, batchNumber, totalBatches } = options;
  const results = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (let index = 0; index < batch.length; index++) {
    const item = batch[index];

    try {
      // Validate required fields
      const makeName = item[fieldMapping.make];
      const modelName = item[fieldMapping.model];

      if (!makeName || !modelName) {
        results.skipped++;
        results.processed++;
        continue;
      }

      // Process make
      const make = await createOrUpdateEntry(
        Make,
        { displayValue: makeName.toLowerCase().trim().replace(/\s+/g, "_") },
        {
          displayName: makeName,
          displayValue: makeName.toLowerCase().trim().replace(/\s+/g, "_"),
        },
        { session, updateExisting: options.updateExisting }
      );

      // Process model
      const model = await createOrUpdateEntry(
        Model,
        {
          make: make._id,
          displayValue: modelName.toLowerCase().trim().replace(/\s+/g, "_"),
        },
        {
          displayName: modelName,
          displayValue: modelName.toLowerCase().trim().replace(/\s+/g, "_"),
          make: make._id,
        },
        { session, updateExisting: options.updateExisting }
      );

      // Process optional body
      let body = null;
      if (fieldMapping.body && item[fieldMapping.body]) {
        const bodyName = item[fieldMapping.body];
        body = await createOrUpdateEntry(
          Body,
          { displayValue: bodyName.toLowerCase().trim().replace(/\s+/g, "_") },
          {
            displayName: bodyName,
            displayValue: bodyName.toLowerCase().trim().replace(/\s+/g, "_"),
          },
          { session, updateExisting: options.updateExisting }
        );
      }

      // Process optional variant year
      let variantYear = null;
      if (fieldMapping.year && item[fieldMapping.year]) {
        const yearValue = convertToType(
          item[fieldMapping.year],
          "Integer",
          "year"
        );
        if (
          yearValue &&
          yearValue >= 1900 &&
          yearValue <= new Date().getFullYear() + 2
        ) {
          variantYear = await createOrUpdateEntry(
            VariantYear,
            { year: yearValue },
            {
              year: yearValue,
              displayName: yearValue.toString(),
              displayValue: yearValue.toString(),
            },
            { session, updateExisting: options.updateExisting }
          );
        }
      }

      // Process standard fields with type conversion
      const standardFields = {};
      const standardFieldMap = {
        fuelType: dataTypes?.fuelType || "String",
        transmission: dataTypes?.transmission || "String",
        engineCapacity: dataTypes?.engineCapacity || "String",
        power: dataTypes?.power || "String",
        torque: dataTypes?.torque || "String",
        seatingCapacity: "Integer",
      };

      Object.keys(standardFieldMap).forEach((field) => {
        if (fieldMapping[field] && item[fieldMapping[field]]) {
          standardFields[field] = convertToType(
            item[fieldMapping[field]],
            standardFieldMap[field],
            field
          );
        }
      });

      // Process custom fields
      const customFields = {};
      if (fieldMapping.customFields) {
        Object.keys(fieldMapping.customFields).forEach((customField) => {
          const sourceField = fieldMapping.customFields[customField];
          if (
            item[sourceField] !== undefined &&
            item[sourceField] !== null &&
            item[sourceField] !== ""
          ) {
            const targetType = customFieldTypes?.[customField] || "String";
            const value = convertToType(
              item[sourceField],
              targetType,
              customField
            );
            if (value !== null) {
              customFields[customField] = value;
            }
          }
        });
      }

      // Generate tags for better searchability
      const tags = [
        make.displayName.toLowerCase(),
        model.displayName.toLowerCase(),
        body?.displayName?.toLowerCase(),
        variantYear?.year?.toString(),
        standardFields.fuelType?.toLowerCase(),
        standardFields.transmission?.toLowerCase(),
      ].filter(Boolean);

      // Create metadata object
      const metadataObj = {
        make: make._id,
        model: model._id,
        body: body?._id,
        variantYear: variantYear?._id,
        ...standardFields,
        customFields,
        tags,
        source: "bulk_upload",
        batchId,
        batchNumber,
      };

      // Check for existing metadata
      const filter = {
        make: make._id,
        model: model._id,
        body: body?._id || null,
        variantYear: variantYear?._id || null,
      };

      const existingMetadata = await VehicleMetadata.findOne(filter).session(
        session
      );
      if (existingMetadata) {
        if (options.updateExisting !== false) {
          Object.assign(existingMetadata, metadataObj);
          await existingMetadata.save({ session });
          results.updated++;
        } else {
          results.skipped++;
        }
      } else {
        await VehicleMetadata.create([metadataObj], { session });
        results.created++;
      }

      results.processed++;
    } catch (error) {
      console.error(
        `Error processing item ${index} in batch ${batchNumber}:`,
        error
      );
      results.errors.push({
        batchNumber,
        row: index,
        item: item,
        error: error.message,
      });
    }
  }

  console.log(
    `Batch ${batchNumber}/${totalBatches} completed: ${results.processed} processed, ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`
  );

  return results;
};

// Parse uploaded file with batch processing for large files
exports.parseUploadedFile = async (req, res) => {
  try {
    const { fileType, fileContent } = req.body;

    let parsedData = [];
    let detectedFields = [];

    if (fileType === "json") {
      try {
        const jsonData = JSON.parse(fileContent);

        // Handle different JSON structures
        if (Array.isArray(jsonData)) {
          parsedData = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          parsedData = jsonData.data;
        } else if (typeof jsonData === "object") {
          parsedData = [jsonData];
        } else {
          throw new Error("Invalid JSON structure - expected array of objects");
        }

        if (parsedData.length > 0) {
          detectedFields = Object.keys(parsedData[0]);
        }
      } catch (jsonError) {
        return res.status(400).json({
          success: false,
          message: "Invalid JSON format",
          error: jsonError.message,
        });
      }
    } else if (fileType === "excel") {
      try {
        // Handle both buffer and array input
        let buffer;
        if (Array.isArray(fileContent)) {
          buffer = Buffer.from(fileContent);
        } else if (Buffer.isBuffer(fileContent)) {
          buffer = fileContent;
        } else {
          buffer = Buffer.from(fileContent, "base64");
        }

        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with header detection
        parsedData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (parsedData.length > 0) {
          detectedFields = Object.keys(parsedData[0]);
        }
      } catch (excelError) {
        console.error("Excel parsing error:", excelError);
        return res.status(400).json({
          success: false,
          message: "Invalid Excel format",
          error: excelError.message,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type. Please use JSON or Excel files.",
      });
    }

    if (parsedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data found in the uploaded file",
      });
    }

    // For large files, process analysis in batches
    const analysisLimit = Math.min(500, parsedData.length);
    const dataTypeAnalysis = analyzeDataTypes(
      parsedData.slice(0, analysisLimit)
    );

    // Calculate estimated processing time and batches
    const estimatedBatches = Math.ceil(parsedData.length / BATCH_SIZE);
    const estimatedTime = Math.ceil((parsedData.length / BATCH_SIZE) * 2); // ~2 minutes per batch

    res.json({
      success: true,
      data: {
        records: parsedData,
        detectedFields,
        recordCount: parsedData.length,
        dataTypeAnalysis,
        sampleData: parsedData.slice(0, 10), // Return first 10 rows as sample
        processingInfo: {
          estimatedBatches,
          estimatedTime: `${estimatedTime} minutes`,
          batchSize: BATCH_SIZE,
          isLargeDataset: parsedData.length > 5000,
        },
      },
    });
  } catch (error) {
    console.error("File parsing error:", error);
    res.status(500).json({
      success: false,
      message: "Error parsing file",
      error: error.message,
    });
  }
};

// Analyze data types in the uploaded data
const analyzeDataTypes = (sampleData) => {
  const analysis = {};

  if (sampleData.length === 0) return analysis;

  const fields = Object.keys(sampleData[0]);

  fields.forEach((field) => {
    const values = sampleData
      .map((row) => row[field])
      .filter((val) => val !== null && val !== undefined && val !== "");

    if (values.length === 0) {
      analysis[field] = { type: "String", confidence: 0, sampleValues: [] };
      return;
    }

    let numberCount = 0;
    let integerCount = 0;
    let booleanCount = 0;
    let dateCount = 0;

    values.forEach((value) => {
      const strValue = String(value).trim();

      // Check for number
      if (!isNaN(parseFloat(strValue)) && isFinite(strValue)) {
        numberCount++;
        if (Number.isInteger(parseFloat(strValue))) {
          integerCount++;
        }
      }

      // Check for boolean
      if (
        ["true", "false", "1", "0", "yes", "no", "on", "off"].includes(
          strValue.toLowerCase()
        )
      ) {
        booleanCount++;
      }

      // Check for date
      if (strValue.length > 6 && !isNaN(Date.parse(strValue))) {
        dateCount++;
      }
    });

    const total = values.length;
    const numberPercentage = numberCount / total;
    const integerPercentage = integerCount / total;
    const booleanPercentage = booleanCount / total;
    const datePercentage = dateCount / total;

    // Determine most likely type with confidence score
    let detectedType = "String";
    let confidence = 0;

    if (integerPercentage > 0.8) {
      detectedType = "Integer";
      confidence = integerPercentage;
    } else if (numberPercentage > 0.8) {
      detectedType = "Number";
      confidence = numberPercentage;
    } else if (booleanPercentage > 0.8) {
      detectedType = "Boolean";
      confidence = booleanPercentage;
    } else if (datePercentage > 0.8) {
      detectedType = "Date";
      confidence = datePercentage;
    } else {
      confidence =
        1 - Math.max(numberPercentage, booleanPercentage, datePercentage);
    }

    analysis[field] = {
      type: detectedType,
      confidence: Math.round(confidence * 100) / 100,
      sampleValues: values.slice(0, 3), // Show first 3 sample values
    };
  });

  return analysis;
};

// Get schema field information
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

// Advanced search with full-text search and filtering (unchanged)
exports.searchVehicleMetadata = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      make,
      model,
      body,
      year,
      fuelType,
      transmission,
      tags,
      customFields,
      source,
      batchId,
      dateRange,
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Filters
    if (make) filter.make = make;
    if (model) filter.model = model;
    if (body) filter.body = body;
    if (year) filter.variantYear = year;
    if (fuelType) filter.fuelType = { $regex: fuelType, $options: "i" };
    if (transmission)
      filter.transmission = { $regex: transmission, $options: "i" };
    if (source) filter.source = source;
    if (batchId) filter.batchId = batchId;

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      filter.tags = { $in: tagArray };
    }

    // Custom fields filter
    if (customFields) {
      try {
        const customFieldsObj =
          typeof customFields === "string"
            ? JSON.parse(customFields)
            : customFields;
        Object.keys(customFieldsObj).forEach((key) => {
          filter[`customFields.${key}`] = customFieldsObj[key];
        });
      } catch (error) {
        console.warn("Invalid custom fields filter:", error);
      }
    }

    // Date range filter
    if (dateRange) {
      try {
        const { start, end } =
          typeof dateRange === "string" ? JSON.parse(dateRange) : dateRange;
        if (start || end) {
          filter.createdAt = {};
          if (start) filter.createdAt.$gte = new Date(start);
          if (end) filter.createdAt.$lte = new Date(end);
        }
      } catch (error) {
        console.warn("Invalid date range filter:", error);
      }
    }

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
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching vehicle metadata",
      error: error.message,
    });
  }
};

// Get upload batches for tracking (unchanged)
exports.getUploadBatches = async (req, res) => {
  try {
    const batches = await VehicleMetadata.aggregate([
      {
        $match: {
          batchId: { $exists: true, $ne: null },
          source: "bulk_upload",
        },
      },
      {
        $group: {
          _id: "$batchId",
          count: { $sum: 1 },
          createdAt: { $first: "$createdAt" },
          source: { $first: "$source" },
          totalBatches: { $first: "$batchNumber" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 50,
      },
    ]);

    res.json({
      success: true,
      data: batches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching upload batches",
      error: error.message,
    });
  }
};

module.exports = exports;

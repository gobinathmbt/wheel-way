const Make = require('../models/Make');
const Model = require('../models/Model');
const Body = require('../models/Body');
const VariantYear = require('../models/VariantYear');
const VehicleMetadata = require('../models/VehicleMetadata');
const { GlobalLog } = require('../models/GlobalLog');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

// Batch processing configuration
const BATCH_SIZE = 2000;
const MAX_CONCURRENT_OPERATIONS = 5;

// Data type conversion helpers
const convertToType = (value, targetType, fieldName) => {
  if (value === null || value === undefined || value === '') return null;
  
  try {
    switch (targetType) {
      case 'Number':
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      case 'Integer':
        const int = parseInt(value);
        return isNaN(int) ? null : int;
      case 'Boolean':
        if (typeof value === 'boolean') return value;
        return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
      case 'String':
        return String(value).trim();
      case 'Date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      default:
        return value;
    }
  } catch (error) {
    console.warn(`Failed to convert ${fieldName}: ${value} to ${targetType}`, error);
    return null;
  }
};

// Enhanced create/update helper with better duplicate handling
const createOrUpdateEntry = async (Model, findCriteria, data, options = {}) => {
  try {
    const session = options.session;
    
    // Try to find existing entry
    const existing = await Model.findOne(findCriteria).session(session);
    if (existing) {
      if (options.updateExisting !== false) {
        Object.assign(existing, data);
        await existing.save({ session });
      }
      return existing;
    }
    
    // Create new entry
    const newEntry = new Model(data);
    await newEntry.save({ session });
    return newEntry;
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error by trying to find the existing record
      const existing = await Model.findOne(findCriteria).session(options.session);
      if (existing) return existing;
    }
    throw error;
  }
};

// Optimized bulk upload with batch processing
exports.bulkUploadMetadata = async (req, res) => {
  const session = await VehicleMetadata.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { data, fieldMapping, dataTypes, customFieldTypes, options = {} } = req.body;
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data provided');
      }

      const batchId = uuidv4();
      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        batchId
      };

      // Process in batches to handle large datasets
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        const batchResults = await processBatch(batch, fieldMapping, dataTypes, customFieldTypes, {
          ...options,
          batchId,
          session,
          user: req.user
        });

        // Accumulate results
        results.processed += batchResults.processed;
        results.created += batchResults.created;
        results.updated += batchResults.updated;
        results.skipped += batchResults.skipped;
        results.errors.push(...batchResults.errors);

        // Send progress update (in real implementation, use WebSocket)
        console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(data.length / BATCH_SIZE)}`);
      }

      // Log the bulk upload activity
      await GlobalLog.create([{
        user_id: req.user._id,
        user_email: req.user.email,
        user_role: req.user.role,
        action: 'BULK_VEHICLE_METADATA_UPLOAD',
        details: `Bulk uploaded ${results.processed} vehicle metadata entries`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        company_id: req.user.company_id,
        metadata: { ...results, totalRecords: data.length }
      }], { session });

      res.json({
        success: true,
        message: 'Bulk upload completed successfully',
        data: results
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during bulk upload',
      error: error.message
    });
  } finally {
    await session.endSession();
  }
};

// Process a single batch of records
const processBatch = async (batch, fieldMapping, dataTypes, customFieldTypes, options) => {
  const { batchId, session, user } = options;
  const results = { processed: 0, created: 0, updated: 0, skipped: 0, errors: [] };

  const concurrencyLimit = Math.min(MAX_CONCURRENT_OPERATIONS, batch.length);
  const semaphore = Array(concurrencyLimit).fill().map(() => Promise.resolve());

  const processRecord = async (item, index) => {
    await semaphore[index % concurrencyLimit];
    semaphore[index % concurrencyLimit] = (async () => {
      try {
        // Validate required fields
        const makeName = item[fieldMapping.make];
        const modelName = item[fieldMapping.model];
        
        if (!makeName || !modelName) {
          results.skipped++;
          return;
        }

        // Process make
        const make = await createOrUpdateEntry(
          Make,
          { displayValue: makeName.toLowerCase().trim().replace(/\s+/g, '_') },
          { displayName: makeName },
          { session }
        );

        // Process model
        const model = await createOrUpdateEntry(
          Model,
          { 
            make: make._id, 
            displayValue: modelName.toLowerCase().trim().replace(/\s+/g, '_') 
          },
          { displayName: modelName, make: make._id },
          { session }
        );

        // Process optional body
        let body = null;
        if (fieldMapping.body && item[fieldMapping.body]) {
          const bodyName = item[fieldMapping.body];
          body = await createOrUpdateEntry(
            Body,
            { displayValue: bodyName.toLowerCase().trim().replace(/\s+/g, '_') },
            { displayName: bodyName },
            { session }
          );
        }

        // Process optional variant year
        let variantYear = null;
        if (fieldMapping.year && item[fieldMapping.year]) {
          const yearValue = convertToType(item[fieldMapping.year], 'Integer', 'year');
          if (yearValue && yearValue >= 1900 && yearValue <= new Date().getFullYear() + 1) {
            variantYear = await createOrUpdateEntry(
              VariantYear,
              { year: yearValue },
              { 
                year: yearValue, 
                displayName: yearValue.toString(),
                displayValue: yearValue.toString()
              },
              { session }
            );
          }
        }

        // Process standard fields with type conversion
        const standardFields = {
          fuelType: convertToType(item[fieldMapping.fuelType], dataTypes?.fuelType || 'String', 'fuelType'),
          transmission: convertToType(item[fieldMapping.transmission], dataTypes?.transmission || 'String', 'transmission'),
          engineCapacity: convertToType(item[fieldMapping.engineCapacity], dataTypes?.engineCapacity || 'String', 'engineCapacity'),
          power: convertToType(item[fieldMapping.power], dataTypes?.power || 'String', 'power'),
          torque: convertToType(item[fieldMapping.torque], dataTypes?.torque || 'String', 'torque'),
          seatingCapacity: convertToType(item[fieldMapping.seatingCapacity], 'Integer', 'seatingCapacity')
        };

        // Process custom fields
        const customFields = new Map();
        if (fieldMapping.customFields) {
          Object.keys(fieldMapping.customFields).forEach(customField => {
            const jsonField = fieldMapping.customFields[customField];
            const targetType = customFieldTypes?.[customField] || 'String';
            const value = convertToType(item[jsonField], targetType, customField);
            if (value !== null) {
              customFields.set(customField, value);
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
          standardFields.transmission?.toLowerCase()
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
          source: 'bulk_upload',
          batchId
        };

        // Check for existing metadata
        const filter = {
          make: make._id,
          model: model._id,
          body: body?._id || null,
          variantYear: variantYear?._id || null
        };

        const existingMetadata = await VehicleMetadata.findOne(filter).session(session);
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
        results.errors.push({
          row: index,
          item: item,
          error: error.message
        });
      }
    })();
  };

  // Process all records with controlled concurrency
  await Promise.all(batch.map(processRecord));
  
  return results;
};

// Parse uploaded file (JSON or Excel)
exports.parseUploadedFile = async (req, res) => {
  try {
    const { fileType, fileContent } = req.body;
    
    let parsedData = [];
    let detectedFields = [];

    if (fileType === 'json') {
      try {
        const jsonData = JSON.parse(fileContent);
        
        // Handle different JSON structures
        if (Array.isArray(jsonData)) {
          parsedData = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data)) {
          parsedData = jsonData.data;
        } else if (typeof jsonData === 'object') {
          // If it's a single object, wrap it in an array
          parsedData = [jsonData];
        } else {
          throw new Error('Invalid JSON structure');
        }
        
        if (parsedData.length > 0) {
          detectedFields = Object.keys(parsedData[0]);
        }
        
      } catch (jsonError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format',
          error: jsonError.message
        });
      }
      
    } else if (fileType === 'excel') {
      try {
        // Parse Excel file
        const workbook = XLSX.read(fileContent, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header detection
        parsedData = XLSX.utils.sheet_to_json(worksheet);
        
        if (parsedData.length > 0) {
          detectedFields = Object.keys(parsedData[0]);
        }
        
      } catch (excelError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Excel format',
          error: excelError.message
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type'
      });
    }

    // Analyze data types
    const dataTypeAnalysis = analyzeDataTypes(parsedData.slice(0, 100)); // Analyze first 100 rows

    res.json({
      success: true,
      data: {
        records: parsedData,
        detectedFields,
        recordCount: parsedData.length,
        dataTypeAnalysis,
        sampleData: parsedData.slice(0, 5) // Return first 5 rows as sample
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error parsing file',
      error: error.message
    });
  }
};

// Analyze data types in the uploaded data
const analyzeDataTypes = (sampleData) => {
  const analysis = {};
  
  if (sampleData.length === 0) return analysis;
  
  const fields = Object.keys(sampleData[0]);
  
  fields.forEach(field => {
    const values = sampleData.map(row => row[field]).filter(val => val !== null && val !== undefined && val !== '');
    
    if (values.length === 0) {
      analysis[field] = { type: 'String', confidence: 0 };
      return;
    }
    
    let numberCount = 0;
    let integerCount = 0;
    let booleanCount = 0;
    let dateCount = 0;
    
    values.forEach(value => {
      // Check for number
      if (!isNaN(parseFloat(value)) && isFinite(value)) {
        numberCount++;
        if (Number.isInteger(parseFloat(value))) {
          integerCount++;
        }
      }
      
      // Check for boolean
      if (['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(String(value).toLowerCase())) {
        booleanCount++;
      }
      
      // Check for date
      if (!isNaN(Date.parse(value))) {
        dateCount++;
      }
    });
    
    const total = values.length;
    const numberPercentage = numberCount / total;
    const integerPercentage = integerCount / total;
    const booleanPercentage = booleanCount / total;
    const datePercentage = dateCount / total;
    
    // Determine most likely type
    if (integerPercentage > 0.8) {
      analysis[field] = { type: 'Integer', confidence: integerPercentage };
    } else if (numberPercentage > 0.8) {
      analysis[field] = { type: 'Number', confidence: numberPercentage };
    } else if (booleanPercentage > 0.8) {
      analysis[field] = { type: 'Boolean', confidence: booleanPercentage };
    } else if (datePercentage > 0.8) {
      analysis[field] = { type: 'Date', confidence: datePercentage };
    } else {
      analysis[field] = { type: 'String', confidence: 1 - Math.max(numberPercentage, booleanPercentage, datePercentage) };
    }
  });
  
  return analysis;
};

// Get schema field information
exports.getSchemaFields = async (req, res) => {
  try {
    const schemaFields = {
      required: [
        { name: 'make', type: 'String', description: 'Vehicle make/manufacturer' },
        { name: 'model', type: 'String', description: 'Vehicle model' }
      ],
      optional: [
        { name: 'body', type: 'String', description: 'Body type (sedan, suv, hatchback, etc.)' },
        { name: 'year', type: 'Integer', description: 'Manufacturing year' },
        { name: 'fuelType', type: 'String', description: 'Fuel type (petrol, diesel, electric, etc.)' },
        { name: 'transmission', type: 'String', description: 'Transmission type (manual, automatic, cvt, etc.)' },
        { name: 'engineCapacity', type: 'String', description: 'Engine capacity/displacement' },
        { name: 'power', type: 'String', description: 'Engine power output' },
        { name: 'torque', type: 'String', description: 'Engine torque' },
        { name: 'seatingCapacity', type: 'Integer', description: 'Number of seats' }
      ],
      dataTypes: ['String', 'Integer', 'Number', 'Boolean', 'Date']
    };
    
    res.json({
      success: true,
      data: schemaFields
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching schema fields',
      error: error.message
    });
  }
};

// Advanced search with full-text search and filtering
exports.searchVehicleMetadata = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
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
      dateRange
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
    if (fuelType) filter.fuelType = { $regex: fuelType, $options: 'i' };
    if (transmission) filter.transmission = { $regex: transmission, $options: 'i' };
    if (source) filter.source = source;
    if (batchId) filter.batchId = batchId;
    
    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray };
    }
    
    // Custom fields filter
    if (customFields) {
      try {
        const customFieldsObj = typeof customFields === 'string' ? JSON.parse(customFields) : customFields;
        Object.keys(customFieldsObj).forEach(key => {
          filter[`customFields.${key}`] = customFieldsObj[key];
        });
      } catch (error) {
        console.warn('Invalid custom fields filter:', error);
      }
    }
    
    // Date range filter
    if (dateRange) {
      try {
        const { start, end } = typeof dateRange === 'string' ? JSON.parse(dateRange) : dateRange;
        if (start || end) {
          filter.createdAt = {};
          if (start) filter.createdAt.$gte = new Date(start);
          if (end) filter.createdAt.$lte = new Date(end);
        }
      } catch (error) {
        console.warn('Invalid date range filter:', error);
      }
    }
    
    const metadata = await VehicleMetadata.find(filter)
      .populate('make', 'displayName displayValue')
      .populate('model', 'displayName displayValue')
      .populate('body', 'displayName displayValue')
      .populate('variantYear', 'displayName displayValue year')
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
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching vehicle metadata',
      error: error.message
    });
  }
};

// Get upload batches for tracking
exports.getUploadBatches = async (req, res) => {
  try {
    const batches = await VehicleMetadata.aggregate([
      {
        $match: { 
          batchId: { $exists: true, $ne: null },
          source: 'bulk_upload'
        }
      },
      {
        $group: {
          _id: '$batchId',
          count: { $sum: 1 },
          createdAt: { $first: '$createdAt' },
          source: { $first: '$source' }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 50
      }
    ]);
    
    res.json({
      success: true,
      data: batches
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upload batches',
      error: error.message
    });
  }
};

module.exports = exports;
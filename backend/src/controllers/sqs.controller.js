
const { SQS } = require("@aws-sdk/client-sqs");
const Vehicle = require('../models/Vehicle');
const Company = require('../models/Company');
const { logEvent } = require('./logs.controller');
const config = require('../config/env');

// Initialize SQS client
const sqs = new SQS({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/377745719237/appretail_mobile_dev";

// Required fields validation
const REQUIRED_FIELDS = [
  'vehicle_stock_id',
  'company_id', 
  'vehicle_type',
  'vehicle_hero_image',
  'vin',
  'plate_no',
  'make',
  'model',
  'year',
  'chassis_no'
];

// Validate required fields
const validateRequiredFields = (vehicleData) => {
  const missingFields = [];
  
  REQUIRED_FIELDS.forEach(field => {
    if (!vehicleData[field] || vehicleData[field] === '') {
      missingFields.push(field);
    }
  });
  
  return missingFields;
};

// Validate company exists and is active
const validateCompany = async (companyId) => {
  try {
    const company = await Company.findById(companyId);
    
    if (!company) {
      return { valid: false, error: 'Company not found' };
    }
    
    if (!company.is_active || company.subscription_status !== 'active') {
      return { valid: false, error: 'Company is not active or subscription expired' };
    }
    
    return { valid: true, company };
  } catch (error) {
    return { valid: false, error: 'Invalid company ID format' };
  }
};

// Send message to SQS queue
const sendToQueue = async (vehicleData, messageGroupId = null) => {
  try {
    const messageBody = JSON.stringify(vehicleData);
    
    const params = {
      QueueUrl: QUEUE_URL,
      MessageBody: messageBody,
      MessageGroupId: messageGroupId || `company_${vehicleData.company_id}`,
    };

    const result = await sqs.sendMessage(params);
    return {
      success: true,
      messageId: result.MessageId,
      queueId: result.MessageId
    };
  } catch (error) {
    console.error('Error sending to SQS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Process single vehicle data
const processSingleVehicle = async (vehicleData) => {
  try {
    // Validate required fields
    const missingFields = validateRequiredFields(vehicleData);
    if (missingFields.length > 0) {
      return {
        success: false,
        vehicle_stock_id: vehicleData.vehicle_stock_id,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Validate company
    const companyValidation = await validateCompany(vehicleData.company_id);
    if (!companyValidation.valid) {
      return {
        success: false,
        vehicle_stock_id: vehicleData.vehicle_stock_id,
        error: companyValidation.error
      };
    }

    // Send to queue
    const queueResult = await sendToQueue(vehicleData);
    
    if (!queueResult.success) {
      return {
        success: false,
        vehicle_stock_id: vehicleData.vehicle_stock_id,
        error: `Queue error: ${queueResult.error}`
      };
    }

    return {
      success: true,
      vehicle_stock_id: vehicleData.vehicle_stock_id,
      queue_id: queueResult.queueId,
      message: 'Vehicle data sent to processing queue'
    };

  } catch (error) {
    return {
      success: false,
      vehicle_stock_id: vehicleData.vehicle_stock_id || 'unknown',
      error: error.message
    };
  }
};

// Process bulk vehicle data
const processBulkVehicles = async (vehiclesArray, companyId) => {
  const results = {
    success_records: [],
    failure_records: [],
    total_processed: vehiclesArray.length,
    queue_ids: []
  };

  // Validate company once
  const companyValidation = await validateCompany(companyId);
  if (!companyValidation.valid) {
    // All records fail if company is invalid
    vehiclesArray.forEach(vehicle => {
      results.failure_records.push({
        vehicle_stock_id: vehicle.vehicle_stock_id || 'unknown',
        error: companyValidation.error
      });
    });
    return results;
  }

  // Process each vehicle
  for (const vehicleData of vehiclesArray) {
    // Ensure company_id is set
    vehicleData.company_id = companyId;
    
    const result = await processSingleVehicle(vehicleData);
    
    if (result.success) {
      results.success_records.push({
        vehicle_stock_id: result.vehicle_stock_id,
        queue_id: result.queue_id
      });
      results.queue_ids.push(result.queue_id);
    } else {
      results.failure_records.push({
        vehicle_stock_id: result.vehicle_stock_id,
        error: result.error
      });
    }
  }

  return results;
};

// Process vehicle from queue (this would be called by SQS consumer)
const processVehicleFromQueue = async (messageBody) => {
  try {
    const vehicleData = JSON.parse(messageBody);
    
    // Separate custom fields from standard fields
    const standardFields = {};
    const customFields = {};
    
    // Define all standard fields that exist in schema
    const schemaFields = [
      'vehicle_stock_id', 'company_id', 'vehicle_type', 'vehicle_hero_image',
      'vin', 'plate_no', 'make', 'model', 'year', 'chassis_no', 'variant',
      'model_no', 'body_style', 'name', 'vehicle_category', 'inspection_result',
      'trade_in_result', 'vehicle_other_details', 'vehicle_source', 
      'vehicle_registration', 'vehicle_import_details', 'vehicle_attachments',
      'vehicle_eng_transmission', 'vehicle_specifications', 'vehicle_safety_features',
      'vehicle_odometer', 'vehicle_ownership'
    ];
    
    // Separate fields
    Object.keys(vehicleData).forEach(key => {
      if (schemaFields.includes(key)) {
        standardFields[key] = vehicleData[key];
      } else {
        customFields[key] = vehicleData[key];
      }
    });
    
    // Add custom fields if any
    if (Object.keys(customFields).length > 0) {
      standardFields.custom_fields = customFields;
    }
    
    // Check if vehicle already exists
    const existingVehicle = await Vehicle.findOne({
      vehicle_stock_id: standardFields.vehicle_stock_id,
      company_id: standardFields.company_id
    });

    let vehicle;
    if (existingVehicle) {
      // Update existing vehicle
      Object.assign(existingVehicle, standardFields);
      existingVehicle.queue_status = 'processed';
      existingVehicle.processing_attempts += 1;
      vehicle = await existingVehicle.save();
    } else {
      // Create new vehicle
      vehicle = new Vehicle({
        ...standardFields,
        queue_status: 'processed',
        processing_attempts: 1
      });
      await vehicle.save();
    }

    // Log the event
    await logEvent({
      event_type: 'vehicle_operation',
      event_action: existingVehicle ? 'vehicle_updated' : 'vehicle_created',
      event_description: `Vehicle ${vehicle.vehicle_stock_id} processed from queue`,
      company_id: vehicle.company_id,
      resource_type: 'vehicle',
      resource_id: vehicle._id.toString(),
      metadata: {
        vehicle_stock_id: vehicle.vehicle_stock_id,
        processing_attempts: vehicle.processing_attempts
      }
    });

    return {
      success: true,
      vehicle_id: vehicle._id,
      vehicle_stock_id: vehicle.vehicle_stock_id,
      action: existingVehicle ? 'updated' : 'created'
    };

  } catch (error) {
    console.error('Error processing vehicle from queue:', error);
    
    // Log the error
    await logEvent({
      event_type: 'system_error',
      event_action: 'queue_processing_failed',
      event_description: `Failed to process vehicle from queue: ${error.message}`,
      severity: 'error',
      status: 'failure',
      error_message: error.message,
      error_stack: error.stack
    });

    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendToQueue,
  processSingleVehicle,
  processBulkVehicles,
  processVehicleFromQueue,
  validateRequiredFields,
  validateCompany
};

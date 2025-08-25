
const { SQS } = require("@aws-sdk/client-sqs");
const Vehicle = require('../models/Vehicle');
const Company = require('../models/Company');
const MasterAdmin = require('../models/MasterAdmin');
const { logEvent } = require('./logs.controller');

// Initialize SQS client with master admin settings
const getSQSClient = async () => {
  try {
    const masterAdmin = await MasterAdmin.findOne({ role: 'master_admin' });
    
    if (!masterAdmin || !masterAdmin.aws_settings) {
      throw new Error('AWS settings not configured in master admin');
    }

    const { access_key_id, secret_access_key, region } = masterAdmin.aws_settings;

    if (!access_key_id || !secret_access_key || !region) {
      throw new Error('Incomplete AWS settings in master admin');
    }

    return new SQS({
      region,
      credentials: {
        accessKeyId: access_key_id,
        secretAccessKey: secret_access_key,
      },
    });
  } catch (error) {
    console.error('Error initializing SQS client:', error);
    throw error;
  }
};

// Get queue URL from master admin settings
const getQueueUrl = async () => {
  try {
    const masterAdmin = await MasterAdmin.findOne({ role: 'master_admin' });
    
    if (!masterAdmin || !masterAdmin.aws_settings || !masterAdmin.aws_settings.sqs_queue_url) {
      throw new Error('SQS Queue URL not configured in master admin');
    }

    return masterAdmin.aws_settings.sqs_queue_url;
  } catch (error) {
    console.error('Error getting queue URL:', error);
    throw error;
  }
};

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
    if (!companyId) {
      return { valid: false, error: 'Company ID is required' };
    }

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

// Validate vehicle_stock_id and vehicle_type combination
const validateVehicleStockId = async (vehicleStockId, companyId, vehicleType) => {
  try {
    if (!vehicleStockId) {
      return { valid: false, error: 'Vehicle stock ID is required' };
    }

    if (!vehicleType) {
      return { valid: false, error: 'Vehicle type is required' };
    }

    if (!['inspection', 'tradein'].includes(vehicleType)) {
      return { valid: false, error: 'Invalid vehicle type. Must be "inspection" or "tradein"' };
    }

    // Check if this exact combination already exists
    const existingVehicle = await Vehicle.findOne({
      vehicle_stock_id: vehicleStockId,
      company_id: companyId,
      vehicle_type: vehicleType
    });

    return { 
      valid: true, 
      exists: !!existingVehicle,
      existingVehicle: existingVehicle
    };
  } catch (error) {
    return { valid: false, error: 'Error validating vehicle stock ID' };
  }
};

// Enhanced basic validation function
const performBasicValidation = async (vehicleData) => {
  // Validate required fields
  const missingFields = validateRequiredFields(vehicleData);
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate company
  const companyValidation = await validateCompany(vehicleData.company_id);
  if (!companyValidation.valid) {
    return {
      valid: false,
      error: companyValidation.error
    };
  }

  // Validate vehicle stock ID and type
  const vehicleValidation = await validateVehicleStockId(
    vehicleData.vehicle_stock_id,
    vehicleData.company_id,
    vehicleData.vehicle_type
  );
  
  if (!vehicleValidation.valid) {
    return {
      valid: false,
      error: vehicleValidation.error
    };
  }

  return {
    valid: true,
    company: companyValidation.company,
    vehicleExists: vehicleValidation.exists,
    existingVehicle: vehicleValidation.existingVehicle
  };
};

// Send message to SQS queue
const sendToQueue = async (vehicleData, messageGroupId = null) => {
  try {
    const sqs = await getSQSClient();
    const queueUrl = await getQueueUrl();
    
    const messageBody = JSON.stringify(vehicleData);
    
    const params = {
      QueueUrl: queueUrl,
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
    console.log(`🔍 Processing single vehicle: ${vehicleData.vehicle_stock_id} - ${vehicleData.vehicle_type}`);

    // Perform basic validation
    const validation = await performBasicValidation(vehicleData);
    if (!validation.valid) {
      console.log(`❌ Validation failed for vehicle ${vehicleData.vehicle_stock_id}: ${validation.error}`);
      return {
        success: false,
        vehicle_stock_id: vehicleData.vehicle_stock_id,
        error: validation.error
      };
    }

    // Send to queue
    const queueResult = await sendToQueue(vehicleData);
    
    if (!queueResult.success) {
      console.log(`❌ Queue error for vehicle ${vehicleData.vehicle_stock_id}: ${queueResult.error}`);
      return {
        success: false,
        vehicle_stock_id: vehicleData.vehicle_stock_id,
        error: `Queue error: ${queueResult.error}`
      };
    }

    console.log(`✅ Vehicle ${vehicleData.vehicle_stock_id} successfully sent to queue`);
    return {
      success: true,
      vehicle_stock_id: vehicleData.vehicle_stock_id,
      queue_id: queueResult.queueId,
      message: 'Vehicle data sent to processing queue',
      exists: validation.vehicleExists
    };

  } catch (error) {
    console.error(`❌ Error processing vehicle ${vehicleData.vehicle_stock_id}:`, error);
    return {
      success: false,
      vehicle_stock_id: vehicleData.vehicle_stock_id || 'unknown',
      error: error.message
    };
  }
};

// Process bulk vehicle data
const processBulkVehicles = async (vehiclesArray, companyId) => {
  console.log(`🔄 Processing ${vehiclesArray.length} vehicles for company ${companyId}`);
  
  const results = {
    success_records: [],
    failure_records: [],
    total_processed: vehiclesArray.length,
    queue_ids: []
  };

  // Validate company once for all vehicles
  const companyValidation = await validateCompany(companyId);
  if (!companyValidation.valid) {
    console.log(`❌ Company validation failed: ${companyValidation.error}`);
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
        queue_id: result.queue_id,
        exists: result.exists
      });
      results.queue_ids.push(result.queue_id);
    } else {
      results.failure_records.push({
        vehicle_stock_id: result.vehicle_stock_id,
        error: result.error
      });
    }
  }

  console.log(`✅ Bulk processing completed: ${results.success_records.length} success, ${results.failure_records.length} failed`);
  return results;
};

// Receive messages from SQS queue
const receiveFromQueue = async (maxMessages = 10) => {
  try {
    const sqs = await getSQSClient();
    const queueUrl = await getQueueUrl();
    
    const params = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 20, // Long polling
      VisibilityTimeout: 300, // 5 minutes to process
      MessageAttributeNames: ['All'],
      AttributeNames: ['All']
    };

    const result = await sqs.receiveMessage(params);
    return {
      success: true,
      messages: result.Messages || []
    };
  } catch (error) {
    console.error('Error receiving from SQS:', error);
    return {
      success: false,
      error: error.message,
      messages: []
    };
  }
};

// Delete processed message from queue
const deleteMessageFromQueue = async (receiptHandle) => {
  try {
    const sqs = await getSQSClient();
    const queueUrl = await getQueueUrl();
    
    const params = {
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle
    };

    await sqs.deleteMessage(params);
    return { success: true };
  } catch (error) {
    console.error('Error deleting message from SQS:', error);
    return { success: false, error: error.message };
  }
};

// Process vehicle from queue (this would be called by SQS consumer)
const processVehicleFromQueue = async (messageBody) => {
  try {
    const vehicleData = JSON.parse(messageBody);
    console.log(`🏗️ Processing vehicle from queue: ${vehicleData.vehicle_stock_id} - ${vehicleData.vehicle_type}`);
    
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
    
    // Check if vehicle already exists with same stock_id, company_id, and vehicle_type
    const existingVehicle = await Vehicle.findOne({
      vehicle_stock_id: standardFields.vehicle_stock_id,
      company_id: standardFields.company_id,
      vehicle_type: standardFields.vehicle_type
    });

    let vehicle;
    let action;

    if (existingVehicle) {
      // Update existing vehicle
      Object.assign(existingVehicle, standardFields);
      existingVehicle.queue_status = 'processed';
      existingVehicle.processing_attempts += 1;
      existingVehicle.last_processing_error = null; // Clear any previous errors
      vehicle = await existingVehicle.save();
      action = 'updated';
      console.log(`✅ Updated existing vehicle: ${vehicle.vehicle_stock_id} - ${vehicle.vehicle_type}`);
    } else {
      // Create new vehicle
      vehicle = new Vehicle({
        ...standardFields,
        queue_status: 'processed',
        processing_attempts: 1,
        status: 'completed'
      });
      await vehicle.save();
      action = 'created';
      console.log(`✅ Created new vehicle: ${vehicle.vehicle_stock_id} - ${vehicle.vehicle_type}`);
    }

    // Log the event
    await logEvent({
      event_type: 'vehicle_operation',
      event_action: `vehicle_${action}`,
      event_description: `Vehicle ${vehicle.vehicle_stock_id} (${vehicle.vehicle_type}) ${action} from queue`,
      company_id: vehicle.company_id,
      resource_type: 'vehicle',
      resource_id: vehicle._id.toString(),
      metadata: {
        vehicle_stock_id: vehicle.vehicle_stock_id,
        vehicle_type: vehicle.vehicle_type,
        processing_attempts: vehicle.processing_attempts
      }
    });

    return {
      success: true,
      vehicle_id: vehicle._id,
      vehicle_stock_id: vehicle.vehicle_stock_id,
      vehicle_type: vehicle.vehicle_type,
      action: action
    };

  } catch (error) {
    console.error('Error processing vehicle from queue:', error);
    
    // Try to extract vehicle info from the message for logging
    let vehicleInfo = {};
    try {
      const vehicleData = JSON.parse(messageBody);
      vehicleInfo = {
        vehicle_stock_id: vehicleData.vehicle_stock_id,
        vehicle_type: vehicleData.vehicle_type,
        company_id: vehicleData.company_id
      };
    } catch (parseError) {
      console.error('Could not parse message body for error logging');
    }
    
    // Log the error
    await logEvent({
      event_type: 'system_error',
      event_action: 'queue_processing_failed',
      event_description: `Failed to process vehicle from queue: ${error.message}`,
      company_id: vehicleInfo.company_id || null,
      severity: 'error',
      status: 'failure',
      error_message: error.message,
      error_stack: error.stack,
      metadata: vehicleInfo
    });

    return {
      success: false,
      error: error.message,
      vehicle_info: vehicleInfo
    };
  }
};

// Process messages from SQS queue
const processQueueMessages = async () => {
  console.log('🔄 Checking SQS queue for messages...');
  
  try {
    const receiveResult = await receiveFromQueue();
    
    if (!receiveResult.success) {
      console.error('❌ Failed to receive messages from queue:', receiveResult.error);
      return {
        success: false,
        error: receiveResult.error,
        processed: 0,
        failed: 0
      };
    }

    const messages = receiveResult.messages;
    console.log(`📨 Received ${messages.length} messages from queue`);

    if (messages.length === 0) {
      return {
        success: true,
        processed: 0,
        failed: 0,
        message: 'No messages in queue'
      };
    }

    let processedCount = 0;
    let failedCount = 0;
    const results = [];

    // Process each message
    for (const message of messages) {
      try {
        console.log(`🏗️ Processing message: ${message.MessageId}`);
        
        const processResult = await processVehicleFromQueue(message.Body);
        
        if (processResult.success) {
          // Delete message from queue after successful processing
          const deleteResult = await deleteMessageFromQueue(message.ReceiptHandle);
          
          if (deleteResult.success) {
            processedCount++;
            console.log(`✅ Successfully processed vehicle: ${processResult.vehicle_stock_id} - ${processResult.vehicle_type} (${processResult.action})`);
            results.push({
              message_id: message.MessageId,
              vehicle_stock_id: processResult.vehicle_stock_id,
              vehicle_type: processResult.vehicle_type,
              action: processResult.action,
              status: 'success'
            });
          } else {
            console.error(`❌ Failed to delete message ${message.MessageId} from queue`);
            failedCount++;
            results.push({
              message_id: message.MessageId,
              vehicle_info: processResult.vehicle_info,
              error: 'Failed to delete from queue',
              status: 'failed'
            });
          }
        } else {
          failedCount++;
          console.error(`❌ Failed to process message ${message.MessageId}:`, processResult.error);
          results.push({
            message_id: message.MessageId,
            vehicle_info: processResult.vehicle_info,
            error: processResult.error,
            status: 'failed'
          });
        }
      } catch (error) {
        failedCount++;
        console.error(`❌ Error processing message ${message.MessageId}:`, error);
        results.push({
          message_id: message.MessageId,
          error: error.message,
          status: 'failed'
        });
      }
    }

    console.log(`✅ Queue processing completed: ${processedCount} processed, ${failedCount} failed`);
    
    return {
      success: true,
      processed: processedCount,
      failed: failedCount,
      total: messages.length,
      results
    };

  } catch (error) {
    console.error('❌ Error in queue processing:', error);
    return {
      success: false,
      error: error.message,
      processed: 0,
      failed: 0
    };
  }
};

// Start queue consumer with interval
let queueInterval;

const startQueueConsumer = () => {
  console.log('🚀 Starting SQS queue consumer...');
  
  // Process immediately
  processQueueMessages();
  
  // Set up interval to process every 10 seconds
  queueInterval = setInterval(() => {
    processQueueMessages();
  }, 10000); // 10 seconds
  
  console.log('⏰ Queue consumer started - checking every 10 seconds');
};

const stopQueueConsumer = () => {
  if (queueInterval) {
    clearInterval(queueInterval);
    queueInterval = null;
    console.log('⏹️ Queue consumer stopped');
  }
};

module.exports = {
  sendToQueue,
  processSingleVehicle,
  processBulkVehicles,
  processVehicleFromQueue,
  validateRequiredFields,
  validateCompany,
  validateVehicleStockId,
  performBasicValidation,
  receiveFromQueue,
  deleteMessageFromQueue,
  processQueueMessages,
  startQueueConsumer,
  stopQueueConsumer
};

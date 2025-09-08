const { SQS } = require("@aws-sdk/client-sqs");
const MasterAdmin = require('../models/MasterAdmin');
const { generateWorkshopReport } = require('./workshopReport.controller');
const { logEvent } = require('./logs.controller');

// Initialize SQS client for workshop reports
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

// Get workshop report queue URL
const getWorkshopReportQueueUrl = () => {
  // Using the provided SQS URL
  return 'https://sqs.us-east-1.amazonaws.com/377745719237/appretail_mobile_dev_workshop_process';
};

// Send workshop report generation to queue
const sendToWorkshopReportQueue = async (workshopData) => {
  try {
    const sqs = await getSQSClient();
    const queueUrl = getWorkshopReportQueueUrl();
    
    const messageBody = JSON.stringify({
      ...workshopData,
      message_type: 'workshop_report_generation',
      timestamp: new Date().toISOString()
    });
    
    const params = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageGroupId: `workshop_${workshopData.company_id}`,
      MessageAttributes: {
        'message_type': {
          DataType: 'String',
          StringValue: 'workshop_report_generation'
        },
        'vehicle_type': {
          DataType: 'String', 
          StringValue: workshopData.vehicle_type
        }
      }
    };

    const result = await sqs.sendMessage(params);
    console.log(`✅ Workshop report generation queued: ${result.MessageId}`);
    
    return {
      success: true,
      messageId: result.MessageId,
      queueId: result.MessageId
    };
  } catch (error) {
    console.error('Error sending to workshop report queue:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Process workshop report from queue
const processWorkshopReportFromQueue = async (messageBody) => {
  try {
    const workshopData = JSON.parse(messageBody);
    console.log(`🏗️ Processing workshop report from queue: ${workshopData.vehicle_stock_id}`);
    
    // Validate message type
    if (workshopData.message_type !== 'workshop_report_generation') {
      console.log('⚠️ Ignoring non-workshop-report message');
      return { success: true, skipped: true };
    }

    // Generate workshop report
    const result = await generateWorkshopReport(workshopData);
    
    // Log the event
    await logEvent({
      event_type: 'workshop_operation',
      event_action: 'report_generated',
      event_description: `Workshop report generated for vehicle ${workshopData.vehicle_stock_id}`,
      company_id: workshopData.company_id,
      resource_type: 'vehicle',
      resource_id: workshopData.vehicle_id,
      metadata: {
        vehicle_stock_id: workshopData.vehicle_stock_id,
        vehicle_type: workshopData.vehicle_type,
        generated_by: workshopData.completed_by
      }
    });

    console.log(`✅ Workshop report generated successfully for vehicle ${workshopData.vehicle_stock_id}`);
    return {
      success: true,
      vehicle_id: workshopData.vehicle_id,
      vehicle_stock_id: workshopData.vehicle_stock_id,
      vehicle_type: workshopData.vehicle_type
    };

  } catch (error) {
    console.error('Error processing workshop report from queue:', error);
    
    // Log the error
    let workshopInfo = {};
    try {
      const workshopData = JSON.parse(messageBody);
      workshopInfo = {
        vehicle_stock_id: workshopData.vehicle_stock_id,
        vehicle_type: workshopData.vehicle_type,
        company_id: workshopData.company_id
      };
    } catch (parseError) {
      console.error('Could not parse message body for error logging');
    }
    
    await logEvent({
      event_type: 'system_error',
      event_action: 'workshop_report_generation_failed',
      event_description: `Failed to generate workshop report: ${error.message}`,
      company_id: workshopInfo.company_id || null,
      severity: 'error',
      status: 'failure',
      error_message: error.message,
      error_stack: error.stack,
      metadata: workshopInfo
    });

    return {
      success: false,
      error: error.message,
      workshop_info: workshopInfo
    };
  }
};

module.exports = {
  sendToWorkshopReportQueue,
  processWorkshopReportFromQueue,
  getSQSClient,
  getWorkshopReportQueueUrl
};
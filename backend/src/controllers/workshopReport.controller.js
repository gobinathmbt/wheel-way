const Vehicle = require('../models/Vehicle');
const WorkshopQuote = require('../models/WorkshopQuote');
const WorkshopReport = require('../models/WorkshopReport');
const Supplier = require('../models/Supplier');
const Conversation = require('../models/Conversation');
const Company = require('../models/Company');
const User = require('../models/User');
const { logEvent } = require('./logs.controller');

// Check if workshop can be completed (all fields have completed_jobs status)
const checkWorkshopCompletion = async (req, res) => {
  try {
    const { vehicleId, vehicleType } = req.params;

    // Get vehicle and all its quotes
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Get all quotes for this vehicle
    const quotes = await WorkshopQuote.find({
      vehicle_type: vehicleType,
      company_id: req.user.company_id,
      vehicle_stock_id: vehicle.vehicle_stock_id
    });

    // Get all field IDs from vehicle results
    const resultData = vehicleType === 'inspection' 
      ? vehicle.inspection_result 
      : vehicle.trade_in_result;

    const allFieldIds = [];
    if (resultData && resultData.length > 0) {
      resultData.forEach(item => {
        if (vehicleType === 'inspection' && item.sections) {
          // Inspection structure with categories
          item.sections.forEach(section => {
            if (section.fields) {
              section.fields.forEach(field => {
                allFieldIds.push(field.field_id);
              });
            }
          });
        } else if (vehicleType === 'tradein') {
          // Handle both category and direct section structures for tradein
          if (item.sections) {
            // Category structure
            item.sections.forEach(section => {
              if (section.fields) {
                section.fields.forEach(field => {
                  allFieldIds.push(field.field_id);
                });
              }
            });
          } else if (item.fields) {
            // Direct section structure
            item.fields.forEach(field => {
              allFieldIds.push(field.field_id);
            });
          }
        }
      });
    }

    // Check if all fields have completed_jobs status
    const completedFields = quotes.filter(quote => quote.status === 'completed_jobs').map(q => q.field_id);
    const incompleteFields = allFieldIds.filter(fieldId => !completedFields.includes(fieldId));

    const canComplete = incompleteFields.length === 0 && allFieldIds.length > 0;

    res.json({
      success: true,
      data: {
        canComplete,
        totalFields: allFieldIds.length,
        completedFields: completedFields.length,
        incompleteFields: incompleteFields.length,
        incompleteFieldIds: incompleteFields
      }
    });

  } catch (error) {
    console.error('Check workshop completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking workshop completion status'
    });
  }
};

// Trigger workshop report generation
const completeWorkshop = async (req, res) => {
  try {
    const { vehicleId, vehicleType } = req.params;
    const { confirmation } = req.body;

    // Validate confirmation
    if (confirmation !== 'CONFIRM') {
      return res.status(400).json({
        success: false,
        message: 'Please type CONFIRM to complete workshop'
      });
    }

    // Get vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if workshop can be completed
    const quotes = await WorkshopQuote.find({
      vehicle_type: vehicleType,
      company_id: req.user.company_id,
      vehicle_stock_id: vehicle.vehicle_stock_id
    });

    const completedQuotes = quotes.filter(quote => quote.status === 'completed_jobs');
    if (completedQuotes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No completed jobs found for this vehicle'
      });
    }

    // Set vehicle workshop as completed and report as preparing
    vehicle.workshop_progress = 'completed';
    vehicle.workshop_report_preparing = true;
    await vehicle.save();

    // Send to SQS for report generation
    const { sendToWorkshopReportQueue } = require('./workshopReportSqs.controller');
    const queueResult = await sendToWorkshopReportQueue({
      vehicle_id: vehicle._id,
      company_id: req.user.company_id,
      vehicle_stock_id: vehicle.vehicle_stock_id,
      vehicle_type: vehicleType,
      completed_by: req.user._id
    });

    if (!queueResult.success) {
      // Rollback vehicle status
      vehicle.workshop_progress = 'in_progress';
      vehicle.workshop_report_preparing = false;
      await vehicle.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to queue report generation'
      });
    }

    // Log the event
    await logEvent({
      event_type: 'workshop_operation',
      event_action: 'workshop_completed',
      event_description: `Workshop completed for vehicle ${vehicle.vehicle_stock_id}`,
      company_id: req.user.company_id,
      user_id: req.user._id,
      resource_type: 'vehicle',
      resource_id: vehicle._id.toString(),
      metadata: {
        vehicle_stock_id: vehicle.vehicle_stock_id,
        vehicle_type: vehicleType,
        queue_id: queueResult.queueId
      }
    });

    res.json({
      success: true,
      message: 'Workshop completed successfully. Report will be available shortly.',
      data: {
        queue_id: queueResult.queueId,
        vehicle_id: vehicle._id
      }
    });

  } catch (error) {
    console.error('Complete workshop error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing workshop'
    });
  }
};

// Generate workshop report (called by SQS processor)
const generateWorkshopReport = async (messageData) => {
  try {
    const { vehicle_id, company_id, vehicle_stock_id, vehicle_type, completed_by } = messageData;

    console.log(`🏗️ Generating workshop report for vehicle ${vehicle_stock_id}`);

    // Get all required data
    const vehicle = await Vehicle.findById(vehicle_id);
    const company = await Company.findById(company_id);
    const quotes = await WorkshopQuote.find({
      vehicle_type,
      company_id,
      vehicle_stock_id
    }).populate('selected_suppliers approved_supplier');

    const conversations = await Conversation.find({
      quote_id: { $in: quotes.map(q => q._id) }
    });

    if (!vehicle || !company) {
      throw new Error('Vehicle or company not found');
    }

    // Generate report data based on vehicle type
    if (vehicle_type === 'inspection') {
      await generateInspectionReport(vehicle, company, quotes, conversations, completed_by);
    } else {
      await generateTradeinReport(vehicle, company, quotes, conversations, completed_by);
    }

    console.log(`✅ Workshop report generated for vehicle ${vehicle_stock_id}`);
    return { success: true };

  } catch (error) {
    console.error('Generate workshop report error:', error);
    throw error;
  }
};

// Generate inspection workshop report (multiple stages)
const generateInspectionReport = async (vehicle, company, quotes, conversations, completed_by) => {
  const resultData = vehicle.inspection_result || [];
  const reportReadyFlags = [];

  // Process each category (stage) 
  for (const category of resultData) {
    if (!category.sections || category.sections.length === 0) continue;

    const stageQuotes = [];
    const stageCommunications = [];
    const stageAttachments = [];

    // Collect all data for this stage
    for (const section of category.sections) {
      if (!section.fields) continue;

      for (const field of section.fields) {
        const fieldQuotes = quotes.filter(q => q.field_id === field.field_id);
        
        for (const quote of fieldQuotes) {
          // Build quote data
          const quoteData = {
            field_id: field.field_id,
            field_name: field.field_name,
            category_name: category.category_name,
            section_name: section.section_name,
            quote_amount: quote.quote_amount,
            quote_description: quote.quote_description,
            selected_suppliers: quote.selected_suppliers.map(s => ({
              supplier_id: s._id,
              supplier_name: s.name,
              supplier_email: s.email,
              supplier_shop_name: s.supplier_shop_name
            })),
            approved_supplier: quote.approved_supplier ? {
              supplier_id: quote.approved_supplier._id,
              supplier_name: quote.approved_supplier.name,
              supplier_email: quote.approved_supplier.email,
              supplier_shop_name: quote.approved_supplier.supplier_shop_name,
              approved_at: quote.approved_at
            } : null,
            work_details: quote.comment_sheet || {},
            field_images: quote.images || [],
            field_videos: quote.videos || [],
            quote_responses: quote.supplier_responses || [],
            quote_created_at: quote.created_at,
            work_completed_at: quote.work_completed_at
          };

          stageQuotes.push(quoteData);

          // Collect attachments
          if (quote.images) {
            quote.images.forEach(img => {
              stageAttachments.push({
                type: 'field_image',
                url: img,
                field_id: field.field_id,
                uploaded_at: quote.created_at
              });
            });
          }

          // Collect conversations
          const fieldConversations = conversations.filter(c => c.quote_id.toString() === quote._id.toString());
          fieldConversations.forEach(conv => {
            stageCommunications.push({
              conversation_id: conv._id,
              supplier_id: conv.supplier_id,
              field_id: field.field_id,
              field_name: field.field_name,
              total_messages: conv.messages.length,
              last_message_at: conv.last_message_at,
              messages: conv.messages.slice(0, 50) // Limit messages for performance
            });
          });
        }
      }
    }

    // Calculate stage statistics
    const stageStats = calculateStageStatistics(stageQuotes);

    // Create workshop report for this stage
    const reportData = {
      vehicle_id: vehicle._id,
      company_id: company._id,
      vehicle_stock_id: vehicle.vehicle_stock_id,
      vehicle_type: 'inspection',
      report_type: 'stage_workshop',
      stage_name: category.category_name,
      vehicle_details: {
        vin: vehicle.vin,
        plate_no: vehicle.plate_no,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        chassis_no: vehicle.chassis_no,
        variant: vehicle.variant,
        hero_image: vehicle.vehicle_hero_image,
        name: vehicle.name
      },
      workshop_summary: stageStats.summary,
      quotes_data: stageQuotes,
      communications: stageCommunications,
      attachments: stageAttachments,
      statistics: stageStats.detailed,
      generated_by: completed_by
    };

    await WorkshopReport.findOneAndUpdate(
      {
        vehicle_id: vehicle._id,
        report_type: 'stage_workshop',
        stage_name: category.category_name
      },
      reportData,
      { upsert: true, new: true }
    );

    reportReadyFlags.push({
      stage_name: category.category_name,
      ready: true,
      generated_at: new Date()
    });
  }

  // Update vehicle report status
  vehicle.workshop_report_ready = reportReadyFlags;
  vehicle.workshop_report_preparing = false;
  await vehicle.save();
};

// Generate tradein workshop report (single report)
const generateTradeinReport = async (vehicle, company, quotes, conversations, completed_by) => {
  const allQuotes = [];
  const allCommunications = [];
  const allAttachments = [];

  // Process all quotes for tradein
  for (const quote of quotes) {
    const quoteData = {
      field_id: quote.field_id,
      field_name: quote.field_name,
      quote_amount: quote.quote_amount,
      quote_description: quote.quote_description,
      selected_suppliers: quote.selected_suppliers.map(s => ({
        supplier_id: s._id,
        supplier_name: s.name,
        supplier_email: s.email,
        supplier_shop_name: s.supplier_shop_name
      })),
      approved_supplier: quote.approved_supplier ? {
        supplier_id: quote.approved_supplier._id,
        supplier_name: quote.approved_supplier.name,
        supplier_email: quote.approved_supplier.email,
        supplier_shop_name: quote.approved_supplier.supplier_shop_name,
        approved_at: quote.approved_at
      } : null,
      work_details: quote.comment_sheet || {},
      field_images: quote.images || [],
      field_videos: quote.videos || [],
      quote_responses: quote.supplier_responses || [],
      quote_created_at: quote.created_at,
      work_completed_at: quote.work_completed_at
    };

    allQuotes.push(quoteData);

    // Collect attachments and conversations (same as inspection)
    if (quote.images) {
      quote.images.forEach(img => {
        allAttachments.push({
          type: 'field_image',
          url: img,
          field_id: quote.field_id,
          uploaded_at: quote.created_at
        });
      });
    }

    const fieldConversations = conversations.filter(c => c.quote_id.toString() === quote._id.toString());
    fieldConversations.forEach(conv => {
      allCommunications.push({
        conversation_id: conv._id,
        supplier_id: conv.supplier_id,
        field_id: quote.field_id,
        field_name: quote.field_name,
        total_messages: conv.messages.length,
        last_message_at: conv.last_message_at,
        messages: conv.messages.slice(0, 50)
      });
    });
  }

  const stats = calculateStageStatistics(allQuotes);

  // Create single tradein workshop report
  const reportData = {
    vehicle_id: vehicle._id,
    company_id: company._id,
    vehicle_stock_id: vehicle.vehicle_stock_id,
    vehicle_type: 'tradein',
    report_type: 'full_workshop',
    vehicle_details: {
      vin: vehicle.vin,
      plate_no: vehicle.plate_no,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      chassis_no: vehicle.chassis_no,
      variant: vehicle.variant,
      hero_image: vehicle.vehicle_hero_image,
      name: vehicle.name
    },
    workshop_summary: stats.summary,
    quotes_data: allQuotes,
    communications: allCommunications,
    attachments: allAttachments,
    statistics: stats.detailed,
    generated_by: completed_by
  };

  await WorkshopReport.findOneAndUpdate(
    {
      vehicle_id: vehicle._id,
      report_type: 'full_workshop'
    },
    reportData,
    { upsert: true, new: true }
  );

  // Update vehicle report status
  vehicle.workshop_report_ready = true;
  vehicle.workshop_report_preparing = false;
  await vehicle.save();
};

// Calculate statistics for stage/report
const calculateStageStatistics = (quotes) => {
  const summary = {
    total_fields: quotes.length,
    total_quotes: quotes.length,
    total_work_completed: quotes.filter(q => q.work_details && q.work_details.total_amount).length,
    total_cost: quotes.reduce((sum, q) => sum + (q.work_details?.amount_spent || 0), 0),
    total_gst: quotes.reduce((sum, q) => sum + (q.work_details?.gst_amount || 0), 0),
    grand_total: quotes.reduce((sum, q) => sum + (q.work_details?.total_amount || 0), 0),
    start_date: quotes.length > 0 ? new Date(Math.min(...quotes.map(q => new Date(q.quote_created_at)))) : null,
    completion_date: quotes.length > 0 ? new Date(Math.max(...quotes.filter(q => q.work_completed_at).map(q => new Date(q.work_completed_at)))) : null
  };

  if (summary.start_date && summary.completion_date) {
    summary.duration_days = Math.ceil((summary.completion_date - summary.start_date) / (1000 * 60 * 60 * 24));
  }

  const statusCounts = {
    completed_jobs: 0,
    work_review: 0,
    work_in_progress: 0,
    quote_approved: 0,
    quote_sent: 0,
    quote_request: 0,
    rework: 0
  };

  // Note: We don't have status in our quote data structure, so we'd need to determine this based on other fields
  // For now, we'll assume all are completed since we're only generating reports for completed workshops

  const detailed = {
    fields_by_status: statusCounts,
    avg_completion_time: summary.duration_days || 0,
    cost_breakdown: {
      parts: summary.total_cost * 0.6, // Estimate
      labor: summary.total_cost * 0.3, // Estimate
      other: summary.total_cost * 0.1   // Estimate
    },
    supplier_performance: [] // Could be calculated from quotes
  };

  return { summary, detailed };
};

// Get workshop reports for vehicle
const getWorkshopReports = async (req, res) => {
  try {
    const { vehicleId, vehicleType } = req.params;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    let reports;
    if (vehicleType === 'inspection') {
      // Get all stage reports
      reports = await WorkshopReport.find({
        vehicle_id: vehicleId,
        report_type: 'stage_workshop'
      }).sort({ created_at: -1 });
    } else {
      // Get single tradein report
      reports = await WorkshopReport.find({
        vehicle_id: vehicleId,
        report_type: 'full_workshop'
      }).sort({ created_at: -1 });
    }

    res.json({
      success: true,
      data: {
        reports,
        vehicle_report_status: vehicle.workshop_report_ready,
        report_preparing: vehicle.workshop_report_preparing
      }
    });

  } catch (error) {
    console.error('Get workshop reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workshop reports'
    });
  }
};

// Get specific workshop report
const getWorkshopReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await WorkshopReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Workshop report not found'
      });
    }

    // Check if user has access to this report
    if (report.company_id.toString() !== req.user.company_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Get workshop report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workshop report'
    });
  }
};

module.exports = {
  checkWorkshopCompletion,
  completeWorkshop,
  generateWorkshopReport,
  getWorkshopReports,
  getWorkshopReport
};
// socket.controller.js - Fixed multi-namespace socket management with proper meta integration
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Supplier = require("../models/Supplier");
const Company = require("../models/Company");
const Conversation = require("../models/Conversation");
const WorkshopQuote = require("../models/WorkshopQuote");
const MasterAdmin = require("../models/MasterAdmin");
const Env_Configuration = require("../config/env");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const { logEvent } = require("./logs.controller");
const VehicleMetadata = require("../models/VehicleMetadata");
const Make = require("../models/Make");
const Model = require("../models/Model");
const Body = require("../models/Body");
const VariantYear = require("../models/VariantYear");

let mainIO;
let chatIO;
let metaIO;
const connectedUsers = new Map();
const metaConnectedUsers = new Map();
const activeBulkOperations = new Map(); // Shared operations map

// Batch processing configuration
const BATCH_SIZE = 100;
const BATCH_DELAY = 500;

// Data type conversion helpers (copied from metaSocket.controller.js)
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

// Enhanced create/update helper (copied from metaSocket.controller.js)
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

// Process a single batch with real-time updates - FIXED VERSION
const processBatchWithSocket = async (
  socketId,
  batch,
  fieldMapping,
  dataTypes,
  customFieldTypes,
  options,
  batchInfo
) => {
  const { batchId, session, user, batchNumber, totalBatches } = options;
  const results = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // Use the correct IO instance - metaIO should be available here
  const ioInstance = metaIO;

  if (!ioInstance) {
    console.error("MetaIO instance not available in processBatchWithSocket");
    throw new Error("MetaIO instance not initialized");
  }

  // Send batch start notification
  ioInstance.to(socketId).emit("batch_start", {
    batchId,
    batchNumber,
    totalBatches,
    recordsInBatch: batch.length,
  });

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

      // Send progress update for every 10 records within batch
      if (results.processed % 10 === 0) {
        ioInstance.to(socketId).emit("batch_progress", {
          batchId,
          batchNumber,
          totalBatches,
          recordsProcessed: results.processed,
          totalRecordsInBatch: batch.length,
          progressInBatch: Math.round((results.processed / batch.length) * 100),
        });
      }

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

  // Send batch completion notification
  ioInstance.to(socketId).emit("batch_complete", {
    batchId,
    batchNumber,
    totalBatches,
    results: {
      processed: results.processed,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors.length,
    },
  });

  console.log(
    `Batch ${batchNumber}/${totalBatches} completed: ${results.processed} processed, ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`
  );

  return results;
};

// Helper function to get or create conversation
const getOrCreateConversation = async (quoteId, companyId, supplierId) => {
  try {
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      quote_id: quoteId,
      company_id: companyId,
      supplier_id: supplierId,
    })
      .populate("company_id", "company_name")
      .populate("supplier_id", "name supplier_shop_name");

    if (conversation) {
      return conversation;
    }

    // Get quote details for metadata
    const quote = await WorkshopQuote.findById(quoteId)
      .populate("vehicle")
      .populate("company_id");

    // Create new conversation
    conversation = new Conversation({
      quote_id: quoteId,
      company_id: companyId,
      supplier_id: supplierId,
      metadata: {
        vehicle_stock_id: quote.vehicle_stock_id,
        field_name: quote.field_name,
        vehicle_info: quote.vehicle
          ? {
              make: quote.vehicle.make,
              model: quote.vehicle.model,
              year: quote.vehicle.year,
              plate_no: quote.vehicle.plate_no,
              vin: quote.vehicle.vin,
            }
          : {},
      },
    });

    await conversation.save();

    // Update WorkshopQuote with conversation reference
    await WorkshopQuote.findByIdAndUpdate(quoteId, {
      conversation_id: conversation._id,
    });

    return conversation;
  } catch (error) {
    throw new Error(`Failed to get or create conversation: ${error.message}`);
  }
};

const initializeSocket = (server) => {
  console.log("🔌 Initializing Multi-namespace Socket.io...");

  // Initialize main Socket.IO server
  mainIO = new Server(server, {
    cors: {
      origin: [
        Env_Configuration.FRONTEND_URL || "http://localhost:8080",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
      ],
      methods: ["GET", "POST"],
      credentials: true,
      allowEIO3: true,
    },
    allowEIO3: true,
    transports: ["websocket", "polling"],
    pingTimeout: 120000, // Increased for long operations
    pingInterval: 25000,
  });

  // Initialize Chat namespace
  chatIO = mainIO.of("/chat");

  // Initialize Metadata namespace - FIXED
  metaIO = mainIO.of("/metadata");

  console.log(
    `🌐 Multi-namespace Socket.io server initialized with CORS origin: ${
      Env_Configuration.FRONTEND_URL || "http://localhost:8080"
    }`
  );
  console.log("💬 Chat namespace: /chat");
  console.log("📊 Metadata namespace: /metadata");

  // Chat namespace authentication middleware
  chatIO.use(async (socket, next) => {
    console.log("🔌 Chat socket authentication middleware triggered");
    try {
      const token = socket.handshake.auth.token;
      console.log(
        "🔑 Authenticating chat socket with token:",
        token ? "present" : "missing"
      );
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, Env_Configuration.JWT_SECRET);

      console.log(
        `🔍 Chat socket authentication attempt for user ID: ${decoded.id}, role: ${decoded.role}`
      );

      if (
        decoded.role === "company_super_admin" ||
        decoded.role === "company_admin"
      ) {
        const user = await User.findById(decoded.id);
        if (!user) {
          return next(new Error("User not found"));
        }
        socket.user = {
          ...user.toObject(),
          type: "company",
          _id: user._id.toString(),
          company_id: user.company_id.toString(),
        };
      } else {
        const supplier = await Supplier.findById(decoded.supplier_id);
        if (!supplier) {
          return next(new Error("Supplier not found"));
        }
        socket.user = {
          ...supplier.toObject(),
          type: "supplier",
          _id: supplier._id.toString(),
        };
      }

      next();
    } catch (error) {
      console.error("Chat socket authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Metadata namespace authentication middleware
  metaIO.use(async (socket, next) => {
    console.log("🔌 Metadata socket authentication middleware triggered");
    try {
      const token = socket.handshake.auth.token;
      console.log(
        "🔑 Authenticating metadata socket with token:",
        token ? "present" : "missing"
      );
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, Env_Configuration.JWT_SECRET);

      console.log(
        `🔍 Metadata socket authentication attempt for user ID: ${decoded.id}, role: ${decoded.role}`
      );

      // Allow both master admin and company users for metadata operations
      if (decoded.role === "master_admin") {
        const user = await MasterAdmin.findById(decoded.id);
        if (!user) {
          return next(new Error("Master Admin not found"));
        }

        socket.user = {
          ...user.toObject(),
          type: "master",
          _id: user._id.toString(),
        };
      } else if (
        decoded.role === "company_super_admin" ||
        decoded.role === "company_admin"
      ) {
        const user = await User.findById(decoded.id);
        if (!user) {
          return next(new Error("Company user not found"));
        }

        socket.user = {
          ...user.toObject(),
          type: "company",
          _id: user._id.toString(),
          company_id: user.company_id.toString(),
        };
      } else {
        return next(
          new Error(
            "Unauthorized: Metadata operations restricted to company users and master admins"
          )
        );
      }

      next();
    } catch (error) {
      console.error("Metadata socket authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Initialize Chat namespace handlers
  initializeChatHandlers();

  // Initialize Metadata namespace handlers
  initializeMetaHandlers();

  return { mainIO, chatIO, metaIO };
};

// Chat namespace connection handlers (keeping existing implementation)
const initializeChatHandlers = () => {
  chatIO.on("connection", (socket) => {
    console.log(
      `✅ Chat User connected: ${socket.user.username || socket.user.name} (${
        socket.user.type
      }) - Socket ID: ${socket.id}`
    );

    // Add user to connected users map
    const userKey = `chat_${socket.user.type}_${socket.user._id}`;
    connectedUsers.set(userKey, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date(),
      online: true,
      namespace: "chat",
    });

    // Join user to their personal room
    const userRoom = `chat_${socket.user.type}_${socket.user._id}`;
    socket.join(userRoom);

    // Join user to company/supplier room for notifications
    if (socket.user.type === "company") {
      socket.join(`chat_company_${socket.user.company_id}`);
    } else {
      socket.join(`chat_supplier_${socket.user._id}`);
    }

    // Emit connection success
    socket.emit("chat_connected", {
      message: "Successfully connected to chat server",
      user: {
        id: socket.user._id,
        name: socket.user.username || socket.user.name,
        type: socket.user.type,
      },
      namespace: "chat",
    });

    // Emit online status to relevant users
    emitChatUserStatus(socket.user, true);

    // Chat event handlers (keeping existing implementation)
    socket.on("get_conversation", async (data) => {
      try {
        const { quote_id } = data;

        let companyId, supplierId;

        if (socket.user.type === "company") {
          companyId = socket.user.company_id;
          supplierId = data.supplier_id;
        } else {
          companyId = data.company_id;
          supplierId = socket.user._id;
        }

        const conversation = await getOrCreateConversation(
          quote_id,
          companyId,
          supplierId
        );

        // Populate messages
        await conversation.populate(
          "messages.sender_id",
          "name email supplier_shop_name"
        );

        socket.emit("conversation_data", {
          conversation: conversation.toObject(),
          quote_id,
        });
      } catch (error) {
        console.error("Get conversation error:", error);
        socket.emit("error", { message: "Failed to get conversation" });
      }
    });

    // Additional chat handlers would continue here...

    socket.on("disconnect", (reason) => {
      console.log(
        `❌ Chat User disconnected: ${
          socket.user.username || socket.user.name
        } (${socket.user.type}) - ${reason}`
      );

      const userKey = `chat_${socket.user.type}_${socket.user._id}`;
      const userData = connectedUsers.get(userKey);
      if (userData) {
        userData.online = false;
        userData.lastSeen = new Date();
        connectedUsers.set(userKey, userData);
      }

      emitChatUserStatus(socket.user, false);
      socket.leaveAll();
    });
  });
};

// Metadata namespace connection handlers - PROPERLY INTEGRATED AND FIXED
const initializeMetaHandlers = () => {
  console.log("🔌 Initializing Meta handlers with full socket integration...");

  metaIO.on("connection", (socket) => {
    console.log(
      `✅ Metadata User connected: ${
        socket.user.username || socket.user.first_name
      } (${socket.user.type}) - Socket ID: ${socket.id}`
    );

    // Add user to metadata connected users map
    const userKey = `meta_${socket.user.type}_${socket.user._id}`;
    metaConnectedUsers.set(userKey, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date(),
      online: true,
      namespace: "metadata",
    });

    // Join user to their personal metadata room
    const userRoom = `meta_${socket.user.type}_${socket.user._id}`;
    socket.join(userRoom);

    // Join company/master admin room for bulk operations
    if (socket.user.type === "company") {
      socket.join(`meta_company_${socket.user.company_id}`);
    } else if (socket.user.type === "master") {
      socket.join(`meta_master_admin`);
    }

    // Emit connection success
    socket.emit("meta_connected", {
      message: "Successfully connected to metadata server",
      user: {
        id: socket.user._id,
        name: socket.user.username || socket.user.name,
        type: socket.user.type,
      },
      namespace: "metadata",
    });

    // FIXED BULK UPLOAD HANDLER
    socket.on("start_bulk_upload", async (data) => {
      console.log("🚀 Starting integrated bulk upload process...");
      
      const session = await VehicleMetadata.startSession();
      
      try {
        await session.withTransaction(async () => {
          const {
            data: uploadData,
            fieldMapping,
            dataTypes,
            customFieldTypes,
            options = {},
          } = data;

          if (!uploadData || !Array.isArray(uploadData)) {
            socket.emit("upload_error", { message: "Invalid data provided" });
            return;
          }

          const batchId = uuidv4();
          const totalBatches = Math.ceil(uploadData.length / BATCH_SIZE);
          
          // Store operation info in the shared activeBulkOperations map
          activeBulkOperations.set(socket.id, {
            batchId,
            totalRecords: uploadData.length,
            totalBatches,
            startTime: new Date(),
            status: 'running'
          });

          const overallResults = {
            processed: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: [],
            batchId,
            totalBatches,
            totalRecords: uploadData.length,
          };

          // Send upload start notification
          socket.emit("upload_started", {
            batchId,
            totalRecords: uploadData.length,
            totalBatches,
            estimatedTime: Math.ceil(totalBatches * 2),
          });

          // Process data in batches
          for (let i = 0; i < uploadData.length; i += BATCH_SIZE) {
            // Check if operation was cancelled
            const operation = activeBulkOperations.get(socket.id);
            if (!operation || operation.status === 'cancelled') {
              socket.emit("upload_cancelled", { batchId });
              break;
            }

            const batch = uploadData.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            console.log(
              `Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`
            );

            // Use the fixed processBatchWithSocket function
            const batchResults = await processBatchWithSocket(
              socket.id,
              batch,
              fieldMapping,
              dataTypes,
              customFieldTypes,
              {
                ...options,
                batchId,
                session,
                user: socket.user,
                batchNumber,
                totalBatches,
              },
              {} // batchInfo parameter
            );

            // Accumulate results
            overallResults.processed += batchResults.processed;
            overallResults.created += batchResults.created;
            overallResults.updated += batchResults.updated;
            overallResults.skipped += batchResults.skipped;
            overallResults.errors.push(...batchResults.errors);

            // Send overall progress update
            const overallProgress = Math.round((batchNumber / totalBatches) * 100);
            socket.emit("upload_progress", {
              batchId,
              progress: overallProgress,
              currentBatch: batchNumber,
              totalBatches,
              results: {
                processed: overallResults.processed,
                created: overallResults.created,
                updated: overallResults.updated,
                skipped: overallResults.skipped,
                errors: overallResults.errors.length,
              },
              estimatedTimeRemaining: Math.ceil((totalBatches - batchNumber) * 2),
            });

            // Add delay between batches to prevent overwhelming
            if (batchNumber < totalBatches) {
              await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
          }

          // Mark operation as completed
          const operation = activeBulkOperations.get(socket.id);
          if (operation) {
            operation.status = 'completed';
            operation.endTime = new Date();
          }

          // Log the operation
          await logEvent({
            event_type: "meta_operation",
            event_action: "bulk_upload_completed",
            event_description: `Bulk uploaded ${overallResults.processed} vehicle metadata entries in ${totalBatches} batches`,
            user_id: socket.user._id,
            user_role: socket.user.role || socket.user.type,
            metadata: {
              batchId,
              totalRecords: uploadData.length,
              results: overallResults,
            },
          });

          // Send final completion notification
          socket.emit("upload_completed", {
            success: true,
            message: "Bulk upload completed successfully",
            data: overallResults,
            duration: operation ? operation.endTime - operation.startTime : null,
          });

          // Clean up operation tracking
          setTimeout(() => {
            activeBulkOperations.delete(socket.id);
          }, 30000);

        });
      } catch (error) {
        console.error("Integrated bulk upload error:", error);
        
        // Mark operation as failed
        const operation = activeBulkOperations.get(socket.id);
        if (operation) {
          operation.status = 'failed';
          operation.error = error.message;
          operation.endTime = new Date();
        }

        socket.emit("upload_error", {
          message: "Error during bulk upload",
          error: error.message,
        });
      } finally {
        await session.endSession();
      }
    });

    // Handle upload cancellation
    socket.on("cancel_upload", (data) => {
      const { batchId } = data;
      const operation = activeBulkOperations.get(socket.id);
      
      if (operation && operation.batchId === batchId) {
        operation.status = 'cancelled';
        socket.emit("upload_cancelled", {
          batchId,
          message: "Upload cancelled by user"
        });
        console.log(`Upload cancelled by user: ${socket.user.username}, batchId: ${batchId}`);
      }
    });

    // Get upload status
    socket.on("get_upload_status", (data) => {
      const operation = activeBulkOperations.get(socket.id);
      socket.emit("upload_status", {
        hasActiveUpload: !!operation,
        operation: operation || null
      });
    });

    // Test connection
    socket.on("test_connection", () => {
      socket.emit("connection_test_result", {
        status: "success",
        timestamp: new Date(),
        user_id: socket.user._id,
        namespace: "metadata",
      });
    });

    // Heartbeat for long operations
    socket.on("heartbeat", () => {
      socket.emit("heartbeat_ack", {
        timestamp: new Date(),
        user_id: socket.user._id,
      });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(
        `❌ Metadata User disconnected: ${
          socket.user.username || socket.user.first_name
        } (${socket.user.type}) - ${reason}`
      );

      // Clean up active operations
      const operation = activeBulkOperations.get(socket.id);
      if (operation && operation.status === 'running') {
        operation.status = 'disconnected';
        operation.endTime = new Date();
        console.log(`Marking upload as disconnected: ${operation.batchId}`);
      }

      // Update user status
      const userKey = `meta_${socket.user.type}_${socket.user._id}`;
      const userData = metaConnectedUsers.get(userKey);
      if (userData) {
        userData.online = false;
        userData.lastSeen = new Date();
        metaConnectedUsers.set(userKey, userData);
      }

      // Clean up after delay
      setTimeout(() => {
        activeBulkOperations.delete(socket.id);
        metaConnectedUsers.delete(userKey);
      }, 60000);

      socket.leaveAll();
    });
  });
};

// Helper function to emit chat user status
const emitChatUserStatus = (user, isOnline) => {
  const statusData = {
    user_id: user._id,
    user_type: user.type,
    online: isOnline,
    last_seen: new Date(),
    namespace: "chat",
  };

  if (user.type === "company") {
    chatIO
      .to(`chat_company_${user.company_id}`)
      .emit("user_status_change", statusData);
  } else {
    chatIO
      .to(`chat_supplier_${user._id}`)
      .emit("user_status_change", statusData);
  }
};

// Helper function to mark messages as read
const markMessagesAsRead = async (conversationId, userType, userId) => {
  try {
    await Conversation.updateOne(
      {
        _id: conversationId,
        "messages.sender_type": { $ne: userType },
        "messages.is_read": false,
      },
      {
        $set: { "messages.$[elem].is_read": true },
      },
      {
        arrayFilters: [
          {
            "elem.sender_type": { $ne: userType },
            "elem.is_read": false,
          },
        ],
      }
    );
  } catch (error) {
    console.error("Mark messages as read error:", error);
  }
};

// Getter functions for socket instances
const getMainSocketIO = () => {
  if (!mainIO) {
    throw new Error("Main Socket.io not initialized");
  }
  return mainIO;
};

const getChatSocketIO = () => {
  if (!chatIO) {
    throw new Error("Chat Socket.io not initialized");
  }
  return chatIO;
};

const getMetaSocketIO = () => {
  if (!metaIO) {
    throw new Error("Metadata Socket.io not initialized");
  }
  return metaIO;
};

// Legacy support
const getIO = () => {
  return getChatSocketIO();
};

// Get active operations summary for all namespaces
const getActiveOperations = () => {
  const operations = {};
  activeBulkOperations.forEach((operation, socketId) => {
    operations[socketId] = {
      ...operation,
      duration: operation.endTime ? 
        operation.endTime - operation.startTime : 
        Date.now() - operation.startTime
    };
  });
  return operations;
};

module.exports = {
  initializeSocket,
  getIO,
  getMainSocketIO,
  getChatSocketIO,
  getMetaSocketIO,
  getActiveOperations,
  connectedUsers,
  metaConnectedUsers,
};
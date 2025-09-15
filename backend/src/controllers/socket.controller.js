// // socket.controller.js - Complete version with all chat events
// const { Server } = require("socket.io");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const Supplier = require("../models/Supplier");
// const Company = require("../models/Company");
// const Conversation = require("../models/Conversation");
// const WorkshopQuote = require("../models/WorkshopQuote");
// const MasterAdmin = require("../models/MasterAdmin");
// const Env_Configuration = require("../config/env");
// const { v4: uuidv4 } = require("uuid");
// const { logEvent } = require("./logs.controller");
// const VehicleMetadata = require("../models/VehicleMetadata");
// const Make = require("../models/Make");
// const Model = require("../models/Model");
// const Body = require("../models/Body");
// const VariantYear = require("../models/VariantYear");

// let mainIO;
// let chatIO;
// let metaIO;
// const connectedUsers = new Map();
// const metaConnectedUsers = new Map();
// const activeBulkOperations = new Map(); // Track active operations by socket ID

// // Batch processing configuration
// const BATCH_SIZE = 100;
// const BATCH_DELAY = 200; // Reduced delay for better performance

// // Data type conversion helpers
// const convertToType = (value, targetType, fieldName) => {
//   if (value === null || value === undefined || value === "") return null;

//   try {
//     switch (targetType) {
//       case "Number":
//         const num = parseFloat(value);
//         return isNaN(num) ? null : num;
//       case "Integer":
//         const int = parseInt(value);
//         return isNaN(int) ? null : int;
//       case "Boolean":
//         if (typeof value === "boolean") return value;
//         return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
//       case "String":
//         return String(value).trim();
//       case "Date":
//         const date = new Date(value);
//         return isNaN(date.getTime()) ? null : date;
//       default:
//         return value;
//     }
//   } catch (error) {
//     console.warn(
//       `Failed to convert ${fieldName}: ${value} to ${targetType}`,
//       error
//     );
//     return null;
//   }
// };

// // Enhanced create/update helper
// const createOrUpdateEntry = async (Model, findCriteria, data, options = {}) => {
//   try {
//     const existing = await Model.findOne(findCriteria);
//     if (existing) {
//       if (options.updateExisting !== false) {
//         Object.assign(existing, data);
//         await existing.save();
//       }
//       return existing;
//     }

//     const newEntry = new Model(data);
//     await newEntry.save();
//     return newEntry;
//   } catch (error) {
//     if (error.code === 11000) {
//       const existing = await Model.findOne(findCriteria);
//       if (existing) return existing;
//     }
//     throw error;
//   }
// };

// // Process batch with proper error handling and sequencing
// const processBatchWithSocket = async (
//   socketId,
//   batch,
//   fieldMapping,
//   dataTypes,
//   customFieldTypes,
//   options,
//   batchInfo
// ) => {
//   const { batchId, user, batchNumber, totalBatches } = options;
//   const results = {
//     processed: 0,
//     created: 0,
//     updated: 0,
//     skipped: 0,
//     errors: [],
//   };

//   const ioInstance = metaIO;
//   if (!ioInstance) {
//     throw new Error("MetaIO instance not initialized");
//   }

//   console.log(
//     `Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`
//   );

//   // Send batch start notification
//   ioInstance.to(socketId).emit("batch_start", {
//     batchId,
//     batchNumber,
//     totalBatches,
//     recordsInBatch: batch.length,
//   });

//   for (let index = 0; index < batch.length; index++) {
//     const item = batch[index];

//     try {
//       // Check if operation was cancelled
//       const operation = activeBulkOperations.get(socketId);
//       if (!operation || operation.status === "cancelled") {
//         console.log(`Operation cancelled, stopping batch ${batchNumber}`);
//         break;
//       }

//       // Validate required fields
//       const makeName = item[fieldMapping.make];
//       const modelName = item[fieldMapping.model];

//       if (!makeName || !modelName) {
//         results.skipped++;
//         results.processed++;
//         continue;
//       }

//       // Process make
//       const make = await createOrUpdateEntry(
//         Make,
//         { displayValue: makeName.toLowerCase().trim().replace(/\s+/g, "_") },
//         {
//           displayName: makeName,
//           displayValue: makeName.toLowerCase().trim().replace(/\s+/g, "_"),
//         },
//         { updateExisting: options.updateExisting }
//       );

//       // Process model
//       const model = await createOrUpdateEntry(
//         Model,
//         {
//           make: make._id,
//           displayValue: modelName.toLowerCase().trim().replace(/\s+/g, "_"),
//         },
//         {
//           displayName: modelName,
//           displayValue: modelName.toLowerCase().trim().replace(/\s+/g, "_"),
//           make: make._id,
//         },
//         { updateExisting: options.updateExisting }
//       );

//       // Process optional body
//       let body = null;
//       if (fieldMapping.body && item[fieldMapping.body]) {
//         const bodyName = item[fieldMapping.body];
//         body = await createOrUpdateEntry(
//           Body,
//           { displayValue: bodyName.toLowerCase().trim().replace(/\s+/g, "_") },
//           {
//             displayName: bodyName,
//             displayValue: bodyName.toLowerCase().trim().replace(/\s+/g, "_"),
//           },
//           { updateExisting: options.updateExisting }
//         );
//       }

//       // Process optional variant year
//       let variantYear = null;
//       if (fieldMapping.year && item[fieldMapping.year]) {
//         const yearValue = convertToType(
//           item[fieldMapping.year],
//           "Integer",
//           "year"
//         );
//         if (
//           yearValue &&
//           yearValue >= 1900 &&
//           yearValue <= new Date().getFullYear() + 2
//         ) {
//           variantYear = await createOrUpdateEntry(
//             VariantYear,
//             { year: yearValue },
//             {
//               year: yearValue,
//               displayName: yearValue.toString(),
//               displayValue: yearValue.toString(),
//             },
//             { updateExisting: options.updateExisting }
//           );
//         }
//       }

//       // Process standard fields with type conversion
//       const standardFields = {};
//       const standardFieldMap = {
//         fuelType: dataTypes?.fuelType || "String",
//         transmission: dataTypes?.transmission || "String",
//         engineCapacity: dataTypes?.engineCapacity || "String",
//         power: dataTypes?.power || "String",
//         torque: dataTypes?.torque || "String",
//         seatingCapacity: "Integer",
//       };

//       Object.keys(standardFieldMap).forEach((field) => {
//         if (fieldMapping[field] && item[fieldMapping[field]]) {
//           standardFields[field] = convertToType(
//             item[fieldMapping[field]],
//             standardFieldMap[field],
//             field
//           );
//         }
//       });

//       // Process custom fields
//       const customFields = {};
//       if (fieldMapping.customFields) {
//         Object.keys(fieldMapping.customFields).forEach((customField) => {
//           const sourceField = fieldMapping.customFields[customField];
//           if (
//             item[sourceField] !== undefined &&
//             item[sourceField] !== null &&
//             item[sourceField] !== ""
//           ) {
//             const targetType = customFieldTypes?.[customField] || "String";
//             const value = convertToType(
//               item[sourceField],
//               targetType,
//               customField
//             );
//             if (value !== null) {
//               customFields[customField] = value;
//             }
//           }
//         });
//       }

//       // Generate tags for better searchability
//       const tags = [
//         make.displayName.toLowerCase(),
//         model.displayName.toLowerCase(),
//         body?.displayName?.toLowerCase(),
//         variantYear?.year?.toString(),
//         standardFields.fuelType?.toLowerCase(),
//         standardFields.transmission?.toLowerCase(),
//       ].filter(Boolean);

//       // Create metadata object
//       const metadataObj = {
//         make: make._id,
//         model: model._id,
//         body: body?._id,
//         variantYear: variantYear?._id,
//         ...standardFields,
//         customFields,
//         tags,
//         source: "bulk_upload",
//         batchId,
//         batchNumber,
//       };

//       // Check for existing metadata
//       const filter = {
//         make: make._id,
//         model: model._id,
//         body: body?._id || null,
//         variantYear: variantYear?._id || null,
//       };

//       const existingMetadata = await VehicleMetadata.findOne(filter);
//       if (existingMetadata) {
//         if (options.updateExisting !== false) {
//           Object.assign(existingMetadata, metadataObj);
//           await existingMetadata.save();
//           results.updated++;
//         } else {
//           results.skipped++;
//         }
//       } else {
//         await VehicleMetadata.create(metadataObj);
//         results.created++;
//       }

//       results.processed++;

//       // Send progress update for every 10 records within batch
//       if (results.processed % 10 === 0) {
//         ioInstance.to(socketId).emit("batch_progress", {
//           batchId,
//           batchNumber,
//           totalBatches,
//           recordsProcessed: results.processed,
//           totalRecordsInBatch: batch.length,
//           progressInBatch: Math.round((results.processed / batch.length) * 100),
//         });
//       }
//     } catch (error) {
//       console.error(
//         `Error processing item ${index} in batch ${batchNumber}:`,
//         error
//       );
//       results.errors.push({
//         batchNumber,
//         row: index,
//         item: item,
//         error: error.message,
//       });
//     }
//   }

//   console.log(
//     `Batch ${batchNumber}/${totalBatches} completed: ${results.processed} processed, ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`
//   );

//   return results;
// };

// // Helper function to get or create conversation
// const getOrCreateConversation = async (quoteId, companyId, supplierId) => {
//   try {
//     // Check if conversation already exists
//     let conversation = await Conversation.findOne({
//       quote_id: quoteId,
//       company_id: companyId,
//       supplier_id: supplierId,
//     })
//       .populate("company_id", "company_name")
//       .populate("supplier_id", "name supplier_shop_name");

//     if (conversation) {
//       return conversation;
//     }

//     // Get quote details for metadata
//     const quote = await WorkshopQuote.findById(quoteId)
//       .populate("vehicle")
//       .populate("company_id");

//     // Create new conversation
//     conversation = new Conversation({
//       quote_id: quoteId,
//       company_id: companyId,
//       supplier_id: supplierId,
//       metadata: {
//         vehicle_stock_id: quote.vehicle_stock_id,
//         field_name: quote.field_name,
//         vehicle_info: quote.vehicle
//           ? {
//               make: quote.vehicle.make,
//               model: quote.vehicle.model,
//               year: quote.vehicle.year,
//               plate_no: quote.vehicle.plate_no,
//               vin: quote.vehicle.vin,
//             }
//           : {},
//       },
//     });

//     await conversation.save();

//     // Update WorkshopQuote with conversation reference
//     await WorkshopQuote.findByIdAndUpdate(quoteId, {
//       conversation_id: conversation._id,
//     });

//     return conversation;
//   } catch (error) {
//     throw new Error(`Failed to get or create conversation: ${error.message}`);
//   }
// };

// const initializeSocket = (server) => {
//   console.log("Initializing Multi-namespace Socket.io...");

//   // Initialize main Socket.IO server
//   mainIO = new Server(server, {
//     // cors: {
//     //   origin: [
//     //     Env_Configuration.FRONTEND_URL || "http://localhost:8080",
//     //     "http://localhost:8080",
//     //     "http://127.0.0.1:8080",
//     //   ],
//     //   methods: ["GET", "POST"],
//     //   credentials: true,
//     //   allowEIO3: true,
//     // },
//       cors: {
//     origin: "*", // Allow all origins (quick fix, not recommended for prod)
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
//     allowEIO3: true,
//     transports: ["websocket", "polling"],
//     pingTimeout: 120000,
//     pingInterval: 25000,
//   });

//   // Initialize Chat namespace
//   chatIO = mainIO.of("/chat");

//   // Initialize Metadata namespace
//   metaIO = mainIO.of("/metadata");

//   console.log(
//     `Multi-namespace Socket.io server initialized with CORS origin: ${
//       Env_Configuration.FRONTEND_URL || "http://localhost:8080"
//     }`
//   );
//   console.log("Chat namespace: /chat");
//   console.log("Metadata namespace: /metadata");

//   // Chat namespace authentication middleware
//   chatIO.use(async (socket, next) => {
//     console.log("Chat socket authentication middleware triggered");
//     try {
//       const token = socket.handshake.auth.token;
//       console.log(
//         "Authenticating chat socket with token:",
//         token ? "present" : "missing"
//       );
//       if (!token) {
//         return next(new Error("Authentication error: No token provided"));
//       }

//       const decoded = jwt.verify(token, Env_Configuration.JWT_SECRET);
//       console.log(
//         `Chat socket authentication attempt for user ID: ${decoded.id}, role: ${decoded.role}`
//       );

//       if (
//         decoded.role === "company_super_admin" ||
//         decoded.role === "company_admin"
//       ) {
//         const user = await User.findById(decoded.id);
//         if (!user) {
//           return next(new Error("User not found"));
//         }
//         socket.user = {
//           ...user.toObject(),
//           type: "company",
//           _id: user._id.toString(),
//           company_id: user.company_id.toString(),
//         };
//       } else {
//         const supplier = await Supplier.findById(decoded.supplier_id);
//         if (!supplier) {
//           return next(new Error("Supplier not found"));
//         }
//         socket.user = {
//           ...supplier.toObject(),
//           type: "supplier",
//           _id: supplier._id.toString(),
//         };
//       }

//       next();
//     } catch (error) {
//       console.error("Chat socket authentication error:", error);
//       next(new Error("Authentication error: Invalid token"));
//     }
//   });

//   // Metadata namespace authentication middleware
//   metaIO.use(async (socket, next) => {
//     console.log("Metadata socket authentication middleware triggered");
//     try {
//       const token = socket.handshake.auth.token;
//       console.log(
//         "Authenticating metadata socket with token:",
//         token ? "present" : "missing"
//       );
//       if (!token) {
//         return next(new Error("Authentication error: No token provided"));
//       }

//       const decoded = jwt.verify(token, Env_Configuration.JWT_SECRET);
//       console.log(
//         `Metadata socket authentication attempt for user ID: ${decoded.id}, role: ${decoded.role}`
//       );

//       // Allow both master admin and company users for metadata operations
//       if (decoded.role === "master_admin") {
//         const user = await MasterAdmin.findById(decoded.id);
//         if (!user) {
//           return next(new Error("Master Admin not found"));
//         }

//         socket.user = {
//           ...user.toObject(),
//           type: "master",
//           _id: user._id.toString(),
//         };
//       } else if (
//         decoded.role === "company_super_admin" ||
//         decoded.role === "company_admin"
//       ) {
//         const user = await User.findById(decoded.id);
//         if (!user) {
//           return next(new Error("Company user not found"));
//         }

//         socket.user = {
//           ...user.toObject(),
//           type: "company",
//           _id: user._id.toString(),
//           company_id: user.company_id.toString(),
//         };
//       } else {
//         return next(
//           new Error(
//             "Unauthorized: Metadata operations restricted to company users and master admins"
//           )
//         );
//       }

//       next();
//     } catch (error) {
//       console.error("Metadata socket authentication error:", error);
//       next(new Error("Authentication error: Invalid token"));
//     }
//   });

//   // Initialize Chat namespace handlers
//   initializeChatHandlers();

//   // Initialize Metadata namespace handlers
//   initializeMetaHandlers();

//   return { mainIO, chatIO, metaIO };
// };

// // Chat namespace connection handlers
// const initializeChatHandlers = () => {
//   chatIO.on("connection", (socket) => {
//     console.log(
//       `Chat User connected: ${socket.user.username || socket.user.name} (${
//         socket.user.type
//       }) - Socket ID: ${socket.id}`
//     );

//     // Add user to connected users map
//     const userKey = `chat_${socket.user.type}_${socket.user._id}`;
//     connectedUsers.set(userKey, {
//       socketId: socket.id,
//       user: socket.user,
//       lastSeen: new Date(),
//       online: true,
//       namespace: "chat",
//     });

//     // Join user to their personal room
//     const userRoom = `chat_${socket.user.type}_${socket.user._id}`;
//     socket.join(userRoom);

//     // Join user to company/supplier room for notifications
//     if (socket.user.type === "company") {
//       socket.join(`chat_company_${socket.user.company_id}`);
//     } else {
//       socket.join(`chat_supplier_${socket.user._id}`);
//     }

//     // Emit connection success
//     socket.emit("chat_connected", {
//       message: "Successfully connected to chat server",
//       user: {
//         id: socket.user._id,
//         name: socket.user.username || socket.user.name,
//         type: socket.user.type,
//       },
//       namespace: "chat",
//     });

//     // Emit online status to relevant users
//     emitChatUserStatus(socket.user, true);

//     // Chat event handlers
//     socket.on("get_conversation", async (data) => {
//       try {
//         const { quote_id } = data;

//         let companyId, supplierId;

//         if (socket.user.type === "company") {
//           companyId = socket.user.company_id;
//           supplierId = data.supplier_id;
//         } else {
//           companyId = data.company_id;
//           supplierId = socket.user._id;
//         }

//         const conversation = await getOrCreateConversation(
//           quote_id,
//           companyId,
//           supplierId
//         );

//         // Populate messages
//         await conversation.populate(
//           "messages.sender_id",
//           "name email supplier_shop_name"
//         );

//         socket.emit("conversation_data", {
//           conversation: conversation.toObject(),
//           quote_id,
//         });
//       } catch (error) {
//         console.error("Get conversation error:", error);
//         socket.emit("error", { message: "Failed to get conversation" });
//       }
//     });

//     // Join conversation room
//     socket.on("join_conversation", async (data) => {
//       try {
//         const { quote_id, supplier_id, company_id } = data;
//         console.log(
//           "Joining conversation room for quote:",
//           quote_id,
//           supplier_id,
//           company_id
//         );
//         let companyId =
//           socket.user.type === "company" ? socket.user.company_id : company_id;
//         let supplierId =
//           socket.user.type === "supplier" ? socket.user._id : supplier_id;

//         const conversation = await getOrCreateConversation(
//           quote_id,
//           companyId,
//           supplierId
//         );

//         if (conversation) {
//           socket.join(`conversation_${quote_id}`);
//           socket.currentConversation = quote_id;

//           // Mark messages as read
//           await markMessagesAsRead(
//             conversation._id,
//             socket.user.type,
//             socket.user._id
//           );

//           // Update unread counts
//           if (socket.user.type === "company") {
//             conversation.unread_count_company = 0;
//           } else {
//             conversation.unread_count_supplier = 0;
//           }
//           await conversation.save();

//           // Populate messages before sending
//           await conversation.populate(
//             "messages.sender_id",
//             "name email supplier_shop_name"
//           );

//           socket.emit("joined_conversation", {
//             quote_id,
//             conversation: conversation.toObject(),
//           });

//           console.log(
//             `User ${
//               socket.user.username || socket.user.name
//             } joined conversation ${quote_id}`
//           );
//         } else {
//           socket.emit("error", {
//             message: "Conversation not found or access denied",
//           });
//         }
//       } catch (error) {
//         console.error("Join conversation error:", error);
//         socket.emit("error", { message: "Failed to join conversation" });
//       }
//     });

//     // Leave conversation room
//     socket.on("leave_conversation", (data) => {
//       const { quote_id } = data;
//       socket.leave(`conversation_${quote_id}`);
//       console.log(
//         `User ${
//           socket.user.username || socket.user.name
//         } left conversation ${quote_id}`
//       );
//     });

//     // Send message with file handling
//     socket.on("send_message", async (data) => {
//       try {
//         const { quote_id, content, message_type = "text", file_data } = data;

//         // Validate file size (10MB limit)
//         if (file_data && file_data.size > 10 * 1024 * 1024) {
//           socket.emit("error", { message: "File size exceeds 10MB limit" });
//           return;
//         }

//         const conversation = await Conversation.findOne({
//           quote_id,
//           $or: [
//             { company_id: socket.user.company_id || socket.user._id },
//             { supplier_id: socket.user._id },
//           ],
//         }).populate("company_id supplier_id");

//         if (!conversation) {
//           socket.emit("error", { message: "Conversation not found" });
//           return;
//         }

//         // Use the pre-uploaded file data from frontend
//         let fileUrl = file_data ? file_data.url : null;
//         let fileKey = file_data ? file_data.key : null;
//         let fileSize = file_data ? file_data.size : null;
//         let fileType = file_data ? file_data.type : null;
//         let fileName = file_data ? file_data.name : null;

//         // Create new message
//         const newMessage = {
//           sender_id: socket.user._id,
//           sender_type: socket.user.type,
//           sender_name: socket.user.username || socket.user.name,
//           message_type,
//           content: content || fileName || "",
//           file_url: fileUrl,
//           file_key: fileKey,
//           file_size: fileSize,
//           file_type: fileType,
//           file_name: fileName,
//           is_read: false,
//           created_at: new Date(),
//         };

//         // Add message to conversation
//         conversation.messages.push(newMessage);

//         // Update unread counts
//         if (socket.user.type === "company") {
//           conversation.unread_count_supplier += 1;
//         } else {
//           conversation.unread_count_company += 1;
//         }

//         conversation.last_message_at = new Date();
//         await conversation.save();

//         // Update WorkshopQuote with conversation reference
//         await WorkshopQuote.findByIdAndUpdate(quote_id, {
//           conversation_id: conversation._id,
//         });

//         // Get the saved message
//         const savedMessage =
//           conversation.messages[conversation.messages.length - 1];

//         // Emit to conversation room
//         chatIO.to(`conversation_${quote_id}`).emit("new_message", {
//           conversation_id: conversation._id,
//           message: savedMessage,
//         });

//         // Notify the other party
//         const targetUserId =
//           socket.user.type === "company"
//             ? `supplier_${conversation.supplier_id}`
//             : `company_${conversation.company_id._id}`;

//         const targetRoom =
//           socket.user.type === "company"
//             ? `supplier_${conversation.supplier_id}`
//             : `company_${conversation.company_id._id}`;

//         chatIO.to(targetRoom).emit("conversation_update", {
//           conversation_id: conversation._id,
//           quote_id: conversation.quote_id,
//           last_message: savedMessage.content,
//           last_message_at: savedMessage.created_at,
//           unread_count:
//             socket.user.type === "company"
//               ? conversation.unread_count_supplier
//               : conversation.unread_count_company,
//           sender_type: socket.user.type,
//         });

//         // Send push notification
//         chatIO.to(targetUserId).emit("new_message_notification", {
//           conversation_id: conversation._id,
//           quote_id: conversation.quote_id,
//           message: savedMessage.content.substring(0, 100) + "...",
//           sender_name: socket.user.username || socket.user.name,
//         });

//         console.log(
//           `Message sent in conversation ${quote_id} by ${
//             socket.user.username || socket.user.name
//           }`
//         );
//       } catch (error) {
//         console.error("Send message error:", error);
//         socket.emit("error", { message: "Failed to send message" });
//       }
//     });

//     // Typing indicators
//     socket.on("typing_start", (data) => {
//       const { quote_id } = data;
//       socket.to(`conversation_${quote_id}`).emit("user_typing", {
//         user_id: socket.user._id,
//         user_name: socket.user.username || socket.user.name,
//         typing: true,
//       });
//     });

//     socket.on("typing_stop", (data) => {
//       const { quote_id } = data;
//       socket.to(`conversation_${quote_id}`).emit("user_typing", {
//         user_id: socket.user._id,
//         user_name: socket.user.username || socket.user.name,
//         typing: false,
//       });
//     });

//     // Mark messages as read
//     socket.on("mark_messages_read", async (data) => {
//       try {
//         const { quote_id } = data;

//         const conversation = await Conversation.findOne({
//           quote_id,
//           $or: [
//             { company_id: socket.user.company_id || socket.user._id },
//             { supplier_id: socket.user._id },
//           ],
//         });

//         if (conversation) {
//           await markMessagesAsRead(
//             conversation._id,
//             socket.user.type,
//             socket.user._id
//           );

//           if (socket.user.type === "company") {
//             conversation.unread_count_company = 0;
//           } else {
//             conversation.unread_count_supplier = 0;
//           }

//           await conversation.save();
//           socket.emit("messages_marked_read", { quote_id });

//           // Emit to other users in conversation
//           socket.to(`conversation_${quote_id}`).emit("messages_marked_read", {
//             quote_id,
//             marked_by: socket.user.type,
//             marked_by_id: socket.user._id,
//           });
//         }
//       } catch (error) {
//         console.error("Mark messages read error:", error);
//       }
//     });

//     // Get user online status
//     socket.on("get_user_status", (data) => {
//       const { user_type, user_id } = data;
//       const userKey = `chat_${user_type}_${user_id}`;
//       const userStatus = connectedUsers.get(userKey);
//       socket.emit("user_status", {
//         user_id,
//         user_type,
//         online: userStatus ? userStatus.online : false,
//         last_seen: userStatus ? userStatus.lastSeen : new Date(),
//       });
//     });

//     // Ping/pong for connection testing
//     socket.on("ping", (data) => {
//       socket.emit("pong", {
//         ...data,
//         serverTime: new Date(),
//       });
//     });

//     // Handle disconnect
//     socket.on("disconnect", (reason) => {
//       console.log(
//         `Chat User disconnected: ${socket.user.username || socket.user.name} (${
//           socket.user.type
//         }) - ${reason}`
//       );

//       const userKey = `chat_${socket.user.type}_${socket.user._id}`;
//       const userData = connectedUsers.get(userKey);
//       if (userData) {
//         userData.online = false;
//         userData.lastSeen = new Date();
//         connectedUsers.set(userKey, userData);
//       }

//       // Stop typing if user was typing
//       if (socket.currentConversation) {
//         socket.to(`conversation_${socket.currentConversation}`).emit("user_typing", {
//           user_id: socket.user._id,
//           user_name: socket.user.username || socket.user.name,
//           typing: false,
//         });
//       }

//       emitChatUserStatus(socket.user, false);
//       socket.leaveAll();
//     });

//     // Handle errors
//     socket.on("error", (error) => {
//       console.error("Chat socket error:", error);
//       socket.emit("error", { message: "Socket error occurred" });
//     });
//   });
// };

// // Metadata namespace connection handlers
// const initializeMetaHandlers = () => {
//   console.log("Initializing Meta handlers with proper batch sequencing...");

//   metaIO.on("connection", (socket) => {
//     console.log(
//       `Metadata User connected: ${
//         socket.user.username || socket.user.first_name
//       } (${socket.user.type}) - Socket ID: ${socket.id}`
//     );

//     // Add user to metadata connected users map
//     const userKey = `meta_${socket.user.type}_${socket.user._id}`;
//     metaConnectedUsers.set(userKey, {
//       socketId: socket.id,
//       user: socket.user,
//       lastSeen: new Date(),
//       online: true,
//       namespace: "metadata",
//     });

//     // Join user to their personal metadata room
//     const userRoom = `meta_${socket.user.type}_${socket.user._id}`;
//     socket.join(userRoom);

//     // Join company/master admin room for bulk operations
//     if (socket.user.type === "company") {
//       socket.join(`meta_company_${socket.user.company_id}`);
//     } else if (socket.user.type === "master") {
//       socket.join(`meta_master_admin`);
//     }

//     // Emit connection success
//     socket.emit("meta_connected", {
//       message: "Successfully connected to metadata server",
//       user: {
//         id: socket.user._id,
//         name: socket.user.username || socket.user.name,
//         type: socket.user.type,
//       },
//       namespace: "metadata",
//     });

//     // Bulk upload configuration handler
//     socket.on("start_bulk_upload_config", async (configData) => {
//       console.log("Received bulk upload configuration");

//       const batchId = uuidv4();
//       const {
//         fieldMapping,
//         dataTypes,
//         customFieldTypes,
//         options = {},
//         totalRecords,
//         totalBatches,
//       } = configData;

//       // Store configuration for this upload
//       activeBulkOperations.set(socket.id, {
//         batchId,
//         fieldMapping,
//         dataTypes,
//         customFieldTypes,
//         options,
//         totalRecords,
//         totalBatches,
//         processedBatches: 0,
//         currentBatch: 0,
//         startTime: new Date(),
//         status: "initialized",
//         results: {
//           processed: 0,
//           created: 0,
//           updated: 0,
//           skipped: 0,
//           errors: [],
//         },
//       });

//       socket.emit("upload_started", {
//         batchId,
//         totalRecords,
//         totalBatches,
//         estimatedTime: Math.ceil(totalBatches * 2),
//       });
//     });

//     // Sequential batch processing handler
//     socket.on("upload_batch", async (batchData) => {
//       const { batchNumber, totalBatches, data: batch } = batchData;
//       const operation = activeBulkOperations.get(socket.id);

//       if (!operation) {
//         console.log("No upload operation found for socket", socket.id);
//         socket.emit("upload_error", {
//           message: "No upload operation configured",
//           batchNumber,
//         });
//         return;
//       }

//       if (operation.status === "cancelled") {
//         console.log(`Upload cancelled, ignoring batch ${batchNumber}`);
//         return;
//       }

//       // Validate batch sequence to prevent duplicates
//       if (batchNumber !== operation.currentBatch + 1) {
//         console.log(
//           `Batch sequence error: expected ${
//             operation.currentBatch + 1
//           }, received ${batchNumber}`
//         );
//         socket.emit("upload_error", {
//           message: `Batch sequence error: expected batch ${
//             operation.currentBatch + 1
//           }, received ${batchNumber}`,
//           batchNumber,
//         });
//         return;
//       }

//       // Update operation status
//       if (operation.status === "initialized") {
//         operation.status = "processing";
//       }

//       operation.currentBatch = batchNumber;

//       try {
//         console.log(
//           `Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`
//         );

//         // Process the batch
//         const batchResults = await processBatchWithSocket(
//           socket.id,
//           batch,
//           operation.fieldMapping,
//           operation.dataTypes,
//           operation.customFieldTypes,
//           {
//             ...operation.options,
//             batchId: operation.batchId,
//             user: socket.user,
//             batchNumber,
//             totalBatches,
//           },
//           {}
//         );

//         // Update overall results
//         operation.results.processed += batchResults.processed;
//         operation.results.created += batchResults.created;
//         operation.results.updated += batchResults.updated;
//         operation.results.skipped += batchResults.skipped;
//         operation.results.errors.push(...batchResults.errors);
//         operation.processedBatches = batchNumber;

//         // Send progress update
//         const overallProgress = Math.round((batchNumber / totalBatches) * 100);
//         socket.emit("upload_progress", {
//           batchId: operation.batchId,
//           progress: overallProgress,
//           currentBatch: batchNumber,
//           totalBatches,
//           results: {
//             processed: operation.results.processed,
//             created: operation.results.created,
//             updated: operation.results.updated,
//             skipped: operation.results.skipped,
//             errors: operation.results.errors.length,
//           },
//           estimatedTimeRemaining: Math.ceil((totalBatches - batchNumber) * 2),
//         });

//         // Single batch completion notification
//         socket.emit("batch_complete", {
//           batchId: operation.batchId,
//           batchNumber,
//           totalBatches,
//           results: {
//             processed: batchResults.processed,
//             created: batchResults.created,
//             updated: batchResults.updated,
//             skipped: batchResults.skipped,
//             errors: batchResults.errors.length,
//           },
//         });

//         // If this is the last batch, complete the upload
//         if (batchNumber === totalBatches) {
//           operation.status = "completed";
//           operation.endTime = new Date();

//           // Log the operation
//           await logEvent({
//             event_type: "meta_operation",
//             event_action: "bulk_upload_completed",
//             event_description: `Bulk uploaded ${operation.results.processed} vehicle metadata entries in ${totalBatches} batches`,
//             user_id: socket.user._id,
//             user_role: socket.user.role || socket.user.type,
//             metadata: {
//               batchId: operation.batchId,
//               totalRecords: operation.totalRecords,
//               results: operation.results,
//             },
//           });

//           // Send final completion notification
//           socket.emit("upload_completed", {
//             success: true,
//             message: "Bulk upload completed successfully",
//             data: operation.results,
//             duration: operation.endTime - operation.startTime,
//           });

//           // Clean up operation tracking after delay
//           setTimeout(() => {
//             activeBulkOperations.delete(socket.id);
//           }, 30000);
//         }
//       } catch (error) {
//         console.error(`Error processing batch ${batchNumber}:`, error);

//         operation.status = "failed";
//         operation.error = error.message;
//         operation.endTime = new Date();

//         socket.emit("upload_error", {
//           message: `Error processing batch ${batchNumber}: ${error.message}`,
//           error: error.message,
//           batchNumber,
//         });

//         // Still emit batch complete for sequencing
//         socket.emit("batch_complete", {
//           batchId: operation.batchId,
//           batchNumber,
//           totalBatches,
//           error: error.message,
//           results: {
//             processed: 0,
//             created: 0,
//             updated: 0,
//             skipped: batch.length,
//             errors: batch.length,
//           },
//         });
//       }
//     });

//     // Handle upload cancellation
//     socket.on("cancel_upload", (data) => {
//       const { batchId } = data;
//       const operation = activeBulkOperations.get(socket.id);

//       if (operation && operation.batchId === batchId) {
//         operation.status = "cancelled";
//         socket.emit("upload_cancelled", {
//           batchId,
//           message: "Upload cancelled by user",
//         });
//         console.log(
//           `Upload cancelled by user: ${socket.user.username}, batchId: ${batchId}`
//         );

//         // Clean up after short delay
//         setTimeout(() => {
//           activeBulkOperations.delete(socket.id);
//         }, 5000);
//       }
//     });

//     // Get upload status
//     socket.on("get_upload_status", (data) => {
//       const operation = activeBulkOperations.get(socket.id);
//       socket.emit("upload_status", {
//         hasActiveUpload: !!operation,
//         operation: operation || null,
//       });
//     });

//     // Test connection
//     socket.on("test_connection", () => {
//       socket.emit("connection_test_result", {
//         status: "success",
//         timestamp: new Date(),
//         user_id: socket.user._id,
//         namespace: "metadata",
//       });
//     });

//     // Heartbeat for long operations
//     socket.on("heartbeat", () => {
//       socket.emit("heartbeat_ack", {
//         timestamp: new Date(),
//         user_id: socket.user._id,
//       });
//     });

//     // Handle disconnect
//     socket.on("disconnect", (reason) => {
//       console.log(
//         `Metadata User disconnected: ${
//           socket.user.username || socket.user.first_name
//         } (${socket.user.type}) - ${reason}`
//       );

//       // Clean up active operations
//       const operation = activeBulkOperations.get(socket.id);
//       if (operation && operation.status === "processing") {
//         operation.status = "disconnected";
//         operation.endTime = new Date();
//         console.log(`Marking upload as disconnected: ${operation.batchId}`);
//       }

//       // Update user status
//       const userKey = `meta_${socket.user.type}_${socket.user._id}`;
//       const userData = metaConnectedUsers.get(userKey);
//       if (userData) {
//         userData.online = false;
//         userData.lastSeen = new Date();
//         metaConnectedUsers.set(userKey, userData);
//       }

//       // Clean up after delay
//       setTimeout(() => {
//         activeBulkOperations.delete(socket.id);
//         metaConnectedUsers.delete(userKey);
//       }, 60000);

//       socket.leaveAll();
//     });
//   });
// };

// // Helper function to emit chat user status
// const emitChatUserStatus = (user, isOnline) => {
//   const statusData = {
//     user_id: user._id,
//     user_type: user.type,
//     online: isOnline,
//     last_seen: new Date(),
//     namespace: "chat",
//   };

//   if (user.type === "company") {
//     chatIO
//       .to(`chat_company_${user.company_id}`)
//       .emit("user_status_change", statusData);
//   } else {
//     chatIO
//       .to(`chat_supplier_${user._id}`)
//       .emit("user_status_change", statusData);
//   }
// };

// // Helper function to mark messages as read
// const markMessagesAsRead = async (conversationId, userType, userId) => {
//   try {
//     await Conversation.updateOne(
//       {
//         _id: conversationId,
//         "messages.sender_type": { $ne: userType },
//         "messages.is_read": false,
//       },
//       {
//         $set: { "messages.$[elem].is_read": true },
//       },
//       {
//         arrayFilters: [
//           {
//             "elem.sender_type": { $ne: userType },
//             "elem.is_read": false,
//           },
//         ],
//       }
//     );
//   } catch (error) {
//     console.error("Mark messages as read error:", error);
//   }
// };

// // Getter functions for socket instances
// const getMainSocketIO = () => {
//   if (!mainIO) {
//     throw new Error("Main Socket.io not initialized");
//   }
//   return mainIO;
// };

// const getChatSocketIO = () => {
//   if (!chatIO) {
//     throw new Error("Chat Socket.io not initialized");
//   }
//   return chatIO;
// };

// const getMetaSocketIO = () => {
//   if (!metaIO) {
//     throw new Error("Metadata Socket.io not initialized");
//   }
//   return metaIO;
// };

// // Legacy support
// const getIO = () => {
//   return getChatSocketIO();
// };

// // Get active operations summary
// const getActiveOperations = () => {
//   const operations = {};
//   activeBulkOperations.forEach((operation, socketId) => {
//     operations[socketId] = {
//       ...operation,
//       duration: operation.endTime
//         ? operation.endTime - operation.startTime
//         : Date.now() - operation.startTime,
//     };
//   });
//   return operations;
// };

// // Get connected users summary
// const getConnectedUsers = () => {
//   return {
//     chat: Array.from(connectedUsers.entries()).map(([key, data]) => ({
//       key,
//       ...data,
//     })),
//     metadata: Array.from(metaConnectedUsers.entries()).map(([key, data]) => ({
//       key,
//       ...data,
//     })),
//   };
// };

// module.exports = {
//   initializeSocket,
//   getIO,
//   getMainSocketIO,
//   getChatSocketIO,
//   getMetaSocketIO,
//   getActiveOperations,
//   getConnectedUsers,
//   connectedUsers,
//   metaConnectedUsers,
// }


// socket.controller.js - Main Socket Controller combining chat and metadata handlers
const { Server } = require("socket.io");
const Env_Configuration = require("../config/env");

// Import chat handlers
const {
  initializeChatHandlers,
  chatAuthMiddleware,
  connectedUsers,
  getOrCreateConversation,
  markMessagesAsRead,
  emitChatUserStatus,
} = require("../handlers/chat.handler");

// Import metadata handlers
const {
  initializeMetaHandlers,
  metaAuthMiddleware,
  metaConnectedUsers,
  activeBulkOperations,
  convertToType,
  createOrUpdateEntry,
  processBatchWithSocket,
  BATCH_SIZE,
  BATCH_DELAY,
} = require("../handlers/metadata.handler");

let mainIO;
let chatIO;
let metaIO;

const initializeSocket = (server) => {
  console.log("Initializing Multi-namespace Socket.io...");

  // Initialize main Socket.IO server
  mainIO = new Server(server, {
    // cors: {
    //   origin: [
    //     Env_Configuration.FRONTEND_URL || "http://localhost:8080",
    //     "http://localhost:8080",
    //     "http://127.0.0.1:8080",
    //   ],
    //   methods: ["GET", "POST"],
    //   credentials: true,
    //   allowEIO3: true,
    // },
    cors: {
      origin: "*", // Allow all origins (quick fix, not recommended for prod)
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowEIO3: true,
    transports: ["websocket", "polling"],
    pingTimeout: 120000,
    pingInterval: 25000,
  });

  // Initialize Chat namespace
  chatIO = mainIO.of("/chat");

  // Initialize Metadata namespace
  metaIO = mainIO.of("/metadata");

  console.log(
    `Multi-namespace Socket.io server initialized with CORS origin: ${
      Env_Configuration.FRONTEND_URL || "http://localhost:8080"
    }`
  );
  console.log("Chat namespace: /chat");
  console.log("Metadata namespace: /metadata");

  // Set up Chat namespace authentication middleware
  chatIO.use(chatAuthMiddleware);

  // Set up Metadata namespace authentication middleware
  metaIO.use(metaAuthMiddleware);

  // Initialize Chat namespace handlers
  initializeChatHandlers(chatIO);

  // Initialize Metadata namespace handlers
  initializeMetaHandlers(metaIO);

  return { mainIO, chatIO, metaIO };
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

// Get active operations summary
const getActiveOperations = () => {
  const operations = {};
  activeBulkOperations.forEach((operation, socketId) => {
    operations[socketId] = {
      ...operation,
      duration: operation.endTime
        ? operation.endTime - operation.startTime
        : Date.now() - operation.startTime,
    };
  });
  return operations;
};

// Get connected users summary
const getConnectedUsers = () => {
  return {
    chat: Array.from(connectedUsers.entries()).map(([key, data]) => ({
      key,
      ...data,
    })),
    metadata: Array.from(metaConnectedUsers.entries()).map(([key, data]) => ({
      key,
      ...data,
    })),
  };
};

module.exports = {
  initializeSocket,
  getIO,
  getMainSocketIO,
  getChatSocketIO,
  getMetaSocketIO,
  getActiveOperations,
  getConnectedUsers,
  connectedUsers,
  metaConnectedUsers,
  // Export helper functions for external use if needed
  getOrCreateConversation,
  markMessagesAsRead,
  emitChatUserStatus,
  convertToType,
  createOrUpdateEntry,
  processBatchWithSocket,
  BATCH_SIZE,
  BATCH_DELAY,
};
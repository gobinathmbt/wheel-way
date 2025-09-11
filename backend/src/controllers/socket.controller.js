// socket.controller.js - Enhanced with conversation management
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Supplier = require("../models/Supplier");
const Company = require("../models/Company");
const Conversation = require("../models/Conversation");
const WorkshopQuote = require("../models/WorkshopQuote");
const Env_Configuration = require("../config/env");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

let io;
const connectedUsers = new Map();

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
  console.log("🔌 Initializing Socket.io...");

  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "http://localhost:8080",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
      ],
      methods: ["GET", "POST"],
      credentials: true,
      allowEIO3: true,
    },
    allowEIO3: true,
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log(
    `🌐 Socket.io server initialized with CORS origin: ${
      process.env.FRONTEND_URL || "http://localhost:8080"
    }`
  );

  // Socket authentication middleware
  io.use(async (socket, next) => {
    console.log("🔌 Socket authentication middleware triggered", socket);
    try {
      const token = socket.handshake.auth.token;
      console.log("🔑 Authenticating socket with token:", token);
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, Env_Configuration.JWT_SECRET);

      console.log(
        `🔑 Socket authentication attempt for user ID: ${decoded.id}, role: ${decoded.role}`
      );

      if (decoded.role === "company_super_admin") {
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
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `✅ User connected: ${socket.user.username || socket.user.name} (${
        socket.user.type
      }) - Socket ID: ${socket.id}`
    );

    // Add user to connected users map
    const userKey = `${socket.user.type}_${socket.user._id}`;
    connectedUsers.set(userKey, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date(),
      online: true,
    });

    // Join user to their personal room
    const userRoom = `${socket.user.type}_${socket.user._id}`;
    socket.join(userRoom);

    // Join user to company/supplier room for notifications
    if (socket.user.type === "company") {
      socket.join(`company_${socket.user.company_id}`);
    } else {
      socket.join(`supplier_${socket.user._id}`);
    }

    // Emit connection success
    socket.emit("connected", {
      message: "Successfully connected to socket server",
      user: {
        id: socket.user._id,
        name: socket.user.username || socket.user.name,
        type: socket.user.type,
      },
    });

    // Emit online status to relevant users
    emitUserStatus(socket.user, true);

    // Get conversation with messages
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

    // Join conversation room
    socket.on("join_conversation", async (data) => {
      try {
        const { quote_id, supplier_id, company_id } = data;
        console.log(
          "🚪 Joining conversation room for quote:",
          quote_id,
          supplier_id,
          company_id
        );
        let companyId =
          socket.user.type === "company" ? socket.user.company_id : company_id;
        let supplierId =
          socket.user.type === "supplier" ? socket.user._id : supplier_id;

        const conversation = await getOrCreateConversation(
          quote_id,
          companyId,
          supplierId
        );

        if (conversation) {
          socket.join(`conversation_${quote_id}`);
          socket.currentConversation = quote_id;

          // Mark messages as read
          await markMessagesAsRead(
            conversation._id,
            socket.user.type,
            socket.user._id
          );

          // Update unread counts
          if (socket.user.type === "company") {
            conversation.unread_count_company = 0;
          } else {
            conversation.unread_count_supplier = 0;
          }
          await conversation.save();

          // Populate messages before sending
          await conversation.populate(
            "messages.sender_id",
            "name email supplier_shop_name"
          );

          socket.emit("joined_conversation", {
            quote_id,
            conversation: conversation.toObject(),
          });

          console.log(
            `📨 User ${
              socket.user.username || socket.user.name
            } joined conversation ${quote_id}`
          );
        } else {
          socket.emit("error", {
            message: "Conversation not found or access denied",
          });
        }
      } catch (error) {
        console.error("Join conversation error:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Send message with improved file handling
    socket.on("send_message", async (data) => {
      try {
        const { quote_id, content, message_type = "text", file_data } = data;

        // Validate file size (10MB limit) - using the size from frontend
        if (file_data && file_data.size > 10 * 1024 * 1024) {
          socket.emit("error", { message: "File size exceeds 10MB limit" });
          return;
        }

        const conversation = await Conversation.findOne({
          quote_id,
          $or: [
            { company_id: socket.user.company_id || socket.user._id },
            { supplier_id: socket.user._id },
          ],
        }).populate("company_id supplier_id");

        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        // Use the pre-uploaded file data from frontend - NO NEED TO UPLOAD AGAIN
        let fileUrl = file_data ? file_data.url : null;
        let fileKey = file_data ? file_data.key : null;
        let fileSize = file_data ? file_data.size : null;
        let fileType = file_data ? file_data.type : null;
        let fileName = file_data ? file_data.name : null;

        // Create new message
        const newMessage = {
          sender_id: socket.user._id,
          sender_type: socket.user.type,
          sender_name: socket.user.username || socket.user.name,
          message_type,
          content: content || fileName || "",
          file_url: fileUrl,
          file_key: fileKey,
          file_size: fileSize,
          file_type: fileType,
          file_name: fileName,
          is_read: false,
          created_at: new Date(),
        };

        // Add message to conversation
        conversation.messages.push(newMessage);

        // Update unread counts
        if (socket.user.type === "company") {
          conversation.unread_count_supplier += 1;
        } else {
          conversation.unread_count_company += 1;
        }

        conversation.last_message_at = new Date();
        await conversation.save();

        // Update WorkshopQuote with conversation reference
        await WorkshopQuote.findByIdAndUpdate(quote_id, {
          conversation_id: conversation._id,
        });

        // Get the saved message
        const savedMessage =
          conversation.messages[conversation.messages.length - 1];

        // Emit to conversation room
        io.to(`conversation_${quote_id}`).emit("new_message", {
          conversation_id: conversation._id,
          message: savedMessage,
        });

        // Notify the other party
        const targetUserId =
          socket.user.type === "company"
            ? `supplier_${conversation.supplier_id}`
            : `company_${conversation.company_id._id}`;

        const targetRoom =
          socket.user.type === "company"
            ? `supplier_${conversation.supplier_id}`
            : `company_${conversation.company_id._id}`;

        io.to(targetRoom).emit("conversation_update", {
          conversation_id: conversation._id,
          quote_id: conversation.quote_id,
          last_message: savedMessage.content,
          last_message_at: savedMessage.created_at,
          unread_count:
            socket.user.type === "company"
              ? conversation.unread_count_supplier
              : conversation.unread_count_company,
          sender_type: socket.user.type,
        });

        // Send push notification
        io.to(targetUserId).emit("new_message_notification", {
          conversation_id: conversation._id,
          quote_id: conversation.quote_id,
          message: savedMessage.content.substring(0, 100) + "...",
          sender_name: socket.user.username || socket.user.name,
        });

        console.log(
          `💬 Message sent in conversation ${quote_id} by ${
            socket.user.username || socket.user.name
          }`
        );
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicators
    socket.on("typing_start", (data) => {
      const { quote_id } = data;
      socket.to(`conversation_${quote_id}`).emit("user_typing", {
        user_id: socket.user._id,
        user_name: socket.user.username || socket.user.name,
        typing: true,
      });
    });

    socket.on("typing_stop", (data) => {
      const { quote_id } = data;
      socket.to(`conversation_${quote_id}`).emit("user_typing", {
        user_id: socket.user._id,
        user_name: socket.user.username || socket.user.name,
        typing: false,
      });
    });

    // Mark messages as read
    socket.on("mark_messages_read", async (data) => {
      try {
        const { quote_id } = data;

        const conversation = await Conversation.findOne({
          quote_id,
          $or: [
            { company_id: socket.user.company_id || socket.user._id },
            { supplier_id: socket.user._id },
          ],
        });

        if (conversation) {
          await markMessagesAsRead(
            conversation._id,
            socket.user.type,
            socket.user._id
          );

          if (socket.user.type === "company") {
            conversation.unread_count_company = 0;
          } else {
            conversation.unread_count_supplier = 0;
          }

          await conversation.save();
          socket.emit("messages_marked_read", { quote_id });
        }
      } catch (error) {
        console.error("Mark messages read error:", error);
      }
    });

    // Get online status
    socket.on("get_user_status", (data) => {
      const { user_type, user_id } = data;
      const userKey = `${user_type}_${user_id}`;
      const userStatus = connectedUsers.get(userKey);
      socket.emit("user_status", {
        user_id,
        user_type,
        online: userStatus ? userStatus.online : false,
        last_seen: userStatus ? userStatus.lastSeen : new Date(),
      });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(
        `❌ User disconnected: ${socket.user.username || socket.user.name} (${
          socket.user.type
        }) - ${reason}`
      );

      // Update user status
      const userKey = `${socket.user.type}_${socket.user._id}`;
      const userData = connectedUsers.get(userKey);
      if (userData) {
        userData.online = false;
        userData.lastSeen = new Date();
        connectedUsers.set(userKey, userData);
      }

      // Emit offline status
      emitUserStatus(socket.user, false);

      // Leave all rooms
      socket.leaveAll();
    });
  });

  return io;
};

// Helper function to emit user status
const emitUserStatus = (user, isOnline) => {
  const statusData = {
    user_id: user._id,
    user_type: user.type,
    online: isOnline,
    last_seen: new Date(),
  };

  if (user.type === "company") {
    io.to(`company_${user.company_id}`).emit("user_status_change", statusData);
  } else {
    io.to(`supplier_${user._id}`).emit("user_status_change", statusData);
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

// Helper function to upload files to S3
const uploadFileToS3 = async (fileData, companyId, messageType) => {
  try {
    // Get company S3 config
    const company = await Company.findById(companyId);
    if (!company || !company.s3_config) {
      throw new Error("S3 configuration not found");
    }

    const s3Config = company.s3_config;
    const s3Client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.access_key,
        secretAccessKey: s3Config.secret_key,
      },
    });

    // Decode base64 file data
    const buffer = Buffer.from(fileData.data, "base64");
    const fileExtension = fileData.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Determine folder based on message type
    let folder = "chat-files";
    if (messageType === "image") folder = "chat-images";
    if (messageType === "video") folder = "chat-videos";

    const key = `${folder}/${companyId}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: buffer,
      ContentType: fileData.type,
      ACL: "public-read",
    });

    await s3Client.send(command);

    const url = s3Config.url
      ? `${s3Config.url}/${key}`
      : `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;

    return {
      url,
      key,
      size: buffer.length,
      type: fileData.type,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};

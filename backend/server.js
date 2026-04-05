const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const http     = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes        = require("./routes/AuthRoute");
const postRoutes        = require("./routes/PostRoute");
const commentRoutes     = require("./routes/CommentRoute");
const shareRoutes       = require("./routes/ShareRoute");
const messageRoutes     = require("./routes/MessageRoute");
const feedRoutes        = require("./routes/FeedRoute");
const blockRoutes        = require("./routes/BlockRoute");
const marketplaceRoutes = require("./routes/MarketplaceRoute");
const cartRoutes        = require("./routes/CartRoute");
const orderRoutes       = require("./routes/OrderRoute");
const userAddress       = require("./routes/UserAddressRoute");
const reviewRoutes      = require("./routes/ReviewRoute");
const refundRoutes      = require("./routes/RefundRoute");
const stripeRoutes      = require("./routes/StripeRoute");
const { stripeWebhook } = require("./controllers/StripeController");
const notificationRoutes = require("./routes/NotificationRoute");

const Message  = require("./models/MessageModel");
const Notification = require("./models/NotificationModel");
const { createNotification } = require("./controllers/NotificationController");

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3000;

// =============================================
// Socket.io
// =============================================
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// userId → Set of socketIds (user có thể mở nhiều tab)
const onlineUsers = new Map();

// Inject io vào NotificationController để dùng trong REST endpoints
const NotificationController = require("./controllers/NotificationController");
NotificationController._setIO = function(ioInstance) {
  NotificationController._io = ioInstance;
};

function addOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}
function removeOnline(userId, socketId) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) onlineUsers.delete(userId);
}
function isOnline(userId) {
  return onlineUsers.has(userId.toString()) && onlineUsers.get(userId.toString()).size > 0;
}
function emitToUser(userId, event, data) {
  const sockets = onlineUsers.get(userId.toString());
  if (sockets) sockets.forEach(sid => io.to(sid).emit(event, data));
}

io.on("connection", (socket) => {

  // ── Online presence ──────────────────────────────────────────
  socket.on("user:online", (userId) => {
    socket.userId = userId.toString();
    addOnline(socket.userId, socket.id);
    socket.join(`user:${socket.userId}`); // Dùng cho notification room
    socket.broadcast.emit("user:status", { userId: socket.userId, online: true });
    socket.emit("users:online", Array.from(onlineUsers.keys()));
  });

  // ── Send message ─────────────────────────────────────────────
  socket.on("message:send", async ({ receiverId, content, replyTo, tempId }) => {
    try {
      const senderId = socket.userId;
      if (!senderId || !receiverId || !content?.trim()) return;

      const msgData = {
        sender:   senderId,
        receiver: receiverId,
        content:  content.trim(),
        status:   "sent"
      };
      if (replyTo) msgData.replyTo = replyTo;

      const message = await Message.create(msgData);
      const populated = await Message.findById(message._id)
        .populate("sender",   "firstname lastname avatar")
        .populate("receiver", "firstname lastname avatar")
        .populate({
          path: "replyTo",
          select: "content sender recalled",
          populate: { path: "sender", select: "firstname lastname" }
        });

      // Xác nhận cho sender (kèm tempId để frontend replace optimistic msg)
      socket.emit("message:sent", { tempId, message: populated });

      // Nếu receiver đang online → gửi + đánh dấu delivered
      if (isOnline(receiverId)) {
        emitToUser(receiverId, "message:new", populated);

        // Auto delivered
        await Message.findByIdAndUpdate(message._id, { status: "delivered" });
        populated.status = "delivered";
        socket.emit("message:status", { messageId: message._id, status: "delivered" });
      }

    } catch (err) {
      console.error("socket message:send error:", err);
      socket.emit("message:error", { tempId, msg: "Failed to send" });
    }
  });

  // ── Mark seen ────────────────────────────────────────────────
  socket.on("message:seen", async ({ messageIds, senderId }) => {
    try {
      if (!messageIds?.length) return;
      await Message.updateMany(
        { _id: { $in: messageIds }, status: { $ne: "seen" } },
        { $set: { status: "seen", seenAt: new Date() } }
      );
      // Thông báo cho sender
      emitToUser(senderId, "message:status_bulk", {
        messageIds,
        status: "seen",
        seenAt: new Date()
      });
    } catch (err) {
      console.error("socket message:seen error:", err);
    }
  });

  // ── Recall message ───────────────────────────────────────────
  socket.on("message:recall", async ({ messageId, receiverId }) => {
    try {
      const message = await Message.findOne({ _id: messageId, sender: socket.userId });
      if (!message) return;

      const hoursSince = (Date.now() - new Date(message.createdAt).getTime()) / 3600000;
        if (hoursSince > 24) {
          socket.emit("message:error", { messageId, msg: "Cannot recall after 24 hours" });
          return;
        }

      message.content  = "";
      message.recalled = true;
      await message.save();

      // Thông báo cả 2 phía
      socket.emit("message:recalled", { messageId });
      emitToUser(receiverId, "message:recalled", { messageId });
    } catch (err) {
      console.error("socket message:recall error:", err);
    }
  });

  // ── React to message ─────────────────────────────────────────
  socket.on("message:react", async ({ messageId, emoji, partnerId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      message.reactions = message.reactions.filter(
        r => r.user.toString() !== socket.userId
      );
      if (emoji?.trim()) {
        message.reactions.push({ user: socket.userId, emoji: emoji.trim() });
      }
      await message.save();

      const populated = await Message.findById(messageId)
        .populate("reactions.user", "firstname lastname avatar");

      const payload = { messageId, reactions: populated.reactions };
      socket.emit("message:reacted", payload);
      emitToUser(partnerId, "message:reacted", payload);

      // Notification: nếu partner react vào tin của mình
      if (emoji?.trim() && socket.userId !== message.sender.toString()) {
        await createNotification(io, {
          recipientId: message.sender,
          senderId: socket.userId,
          type: "like_post", // Dùng chung type, hoặc thêm "react_message" vào enum
          meta: { messageId }
        }).catch(() => {});
      }
    } catch (err) {
      console.error("socket message:react error:", err);
    }
  });

  // ── Delete message (soft) ────────────────────────────────────
  socket.on("message:delete", async ({ messageId }) => {
    try {
      const message = await Message.findOne({
        _id: messageId,
        $or: [{ sender: socket.userId }, { receiver: socket.userId }]
      });
      if (!message) return;

      if (!message.deletedFor.map(id => id.toString()).includes(socket.userId)) {
        message.deletedFor.push(socket.userId);
        await message.save();
      }
      socket.emit("message:deleted", { messageId });
    } catch (err) {
      console.error("socket message:delete error:", err);
    }
  });

  // ── Typing indicator ─────────────────────────────────────────
  socket.on("typing:start", ({ receiverId }) => {
    emitToUser(receiverId, "typing:start", { senderId: socket.userId });
  });
  socket.on("typing:stop", ({ receiverId }) => {
    emitToUser(receiverId, "typing:stop", { senderId: socket.userId });
  });

  // ── Disconnect ───────────────────────────────────────────────
  socket.on("disconnect", () => {
    if (socket.userId) {
      removeOnline(socket.userId, socket.id);
      if (!isOnline(socket.userId)) {
        socket.broadcast.emit("user:status", { userId: socket.userId, online: false });
      }
    }
  });
});

// =============================================
// Express
// =============================================
app.post("/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/users",        authRoutes);
app.use("/posts",        postRoutes);
app.use("/comments",     commentRoutes);
app.use("/shares",       shareRoutes);
app.use("/messages",     messageRoutes);
app.use("/feeds",        feedRoutes);
app.use("/block",        blockRoutes);  // ← thêm dòng này
app.use("/marketplace",  marketplaceRoutes);
app.use("/cart",         cartRoutes);
app.use("/orders",       orderRoutes);
app.use("/user-address", userAddress);
app.use("/reviews",      reviewRoutes);
app.use("/refund",       refundRoutes);
app.use("/stripe",       stripeRoutes);
app.use("/notifications", notificationRoutes);

// Inject io vào controller sau khi init
if (NotificationController._setIO) NotificationController._setIO(io);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Error:", err));
  

// ✅ server.listen thay vì app.listen
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
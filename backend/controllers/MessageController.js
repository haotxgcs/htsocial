const Message = require('../models/MessageModel');

const POPULATE_SENDER   = "firstname lastname avatar";
const POPULATE_RECEIVER = "firstname lastname avatar";

// ─────────────────────────────────────────────────────────────────
// Helper: build base query — loại bỏ tin nhắn bị xóa với user đó
// ─────────────────────────────────────────────────────────────────
function visibleQuery(userId, extra = {}) {
  return {
    ...extra,
    deletedFor: { $nin: [userId] }
  };
}

// =============================================
// POST /messages
// Gửi tin nhắn mới
// Body: { receiverId, content, replyTo? }
// =============================================
exports.sendMessage = async (req, res) => {
  try {
    const senderId              = req.user.id;
    const { receiverId, content, replyTo } = req.body;

    if (!receiverId) {
      return res.status(400).json({ msg: "receiverId is required" });
    }
    if (!content?.trim() && !replyTo) {
      return res.status(400).json({ msg: "content is required" });
    }

    const msgData = {
      sender:   senderId,
      receiver: receiverId,
      content:  content?.trim() || "",
      status:   "sent"
    };
    if (replyTo) msgData.replyTo = replyTo;

    const message = await Message.create(msgData);

    const populated = await Message.findById(message._id)
      .populate("sender",   POPULATE_SENDER)
      .populate("receiver", POPULATE_RECEIVER)
      .populate({
        path: "replyTo",
        select: "content sender recalled",
        populate: { path: "sender", select: "firstname lastname" }
      });

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ msg: "Failed to send message" });
  }
};

// =============================================
// GET /messages/:user1/:user2?page=1&limit=30
// Lấy conversation giữa 2 user (phân trang)
// =============================================
exports.getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { user1, user2 } = req.params;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 30;

    const messages = await Message.find(
      visibleQuery(currentUserId, {
        $or: [
          { sender: user1, receiver: user2 },
          { sender: user2, receiver: user1 }
        ]
      })
    )
      .populate("sender",   POPULATE_SENDER)
      .populate("receiver", POPULATE_RECEIVER)
      .populate({
        path: "replyTo",
        select: "content sender recalled",
        populate: { path: "sender", select: "firstname lastname" }
      })
      .populate("reactions.user", "firstname lastname avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      messages: messages.reverse(),   // cũ → mới
      page,
      hasMore: messages.length === limit
    });
  } catch (err) {
    console.error("getConversation error:", err);
    res.status(500).json({ msg: "Failed to fetch messages" });
  }
};

// =============================================
// GET /messages/contacts
// Danh sách người đã nhắn tin (inbox summary)
// =============================================
exports.getContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const { Types } = require('mongoose');
    const oid = new Types.ObjectId(userId);

    // Tìm tin nhắn mới nhất của mỗi cuộc trò chuyện
    const latest = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: oid }, { receiver: oid }],
          deletedFor: { $nin: [oid] }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ["$sender", "$receiver"] },
              { a: "$sender", b: "$receiver" },
              { a: "$receiver", b: "$sender" }
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$lastMessage" } },
      { $sort: { createdAt: -1 } }
    ]);

    await Message.populate(latest, [
      { path: "sender",   select: POPULATE_SENDER },
      { path: "receiver", select: POPULATE_RECEIVER }
    ]);

    res.status(200).json({ success: true, contacts: latest });
  } catch (err) {
    console.error("getContacts error:", err);
    res.status(500).json({ msg: "Failed to fetch contacts" });
  }
};

// =============================================
// PATCH /messages/:id/status
// Cập nhật status: delivered hoặc seen
// Body: { status: "delivered" | "seen" }
// =============================================
exports.updateStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;
    const userId     = req.user.id;

    if (!["delivered", "seen"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    const update = { status };
    if (status === "seen") update.seenAt = new Date();

    // Chỉ receiver mới được cập nhật status
    const message = await Message.findOneAndUpdate(
      { _id: id, receiver: userId },
      { $set: update },
      { new: true }
    );

    if (!message) return res.status(404).json({ msg: "Message not found" });

    res.json({ success: true, message });
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ msg: "Failed to update status" });
  }
};

// =============================================
// PATCH /messages/seen/:partnerId
// Đánh dấu tất cả tin nhắn từ partner là seen
// =============================================
exports.markAllSeen = async (req, res) => {
  try {
    const userId    = req.user.id;
    const partnerId = req.params.partnerId;

    await Message.updateMany(
      { sender: partnerId, receiver: userId, status: { $ne: "seen" } },
      { $set: { status: "seen", seenAt: new Date() } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("markAllSeen error:", err);
    res.status(500).json({ msg: "Failed to mark seen" });
  }
};

// =============================================
// PUT /messages/recall/:id
// Thu hồi tin nhắn — hiện "Message recalled" với tất cả
// =============================================
exports.recallMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId    = req.user.id;

    const message = await Message.findOne({ _id: messageId, sender: userId });
    if (!message) {
      return res.status(404).json({ msg: "Message not found or not authorized" });
    }

    const hoursSince = (Date.now() - new Date(message.createdAt).getTime()) / 3600000;
    if (hoursSince > 24) {
      return res.status(400).json({ msg: "Cannot recall messages older than 24 hours" });
    }

    message.content  = "";
    message.recalled = true;
    await message.save();

    res.status(200).json({ success: true, message });
  } catch (err) {
    console.error("recallMessage error:", err);
    res.status(500).json({ msg: "Failed to recall message" });
  }
};

// =============================================
// DELETE /messages/:id
// Xóa mềm — chỉ ẩn với user đang login
// =============================================
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId    = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      $or: [{ sender: userId }, { receiver: userId }]
    });
    if (!message) {
      return res.status(404).json({ msg: "Message not found" });
    }

    // Thêm userId vào deletedFor nếu chưa có
    if (!message.deletedFor.map(id => id.toString()).includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    res.status(200).json({ success: true, msg: "Message deleted" });
  } catch (err) {
    console.error("deleteMessage error:", err);
    res.status(500).json({ msg: "Failed to delete message" });
  }
};

// =============================================
// POST /messages/:id/react
// Thả/đổi/xóa reaction
// Body: { emoji } — emoji rỗng = xóa reaction
// =============================================
exports.reactToMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId    = req.user.id;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ msg: "Message not found" });

    // Xóa reaction cũ của user này (nếu có)
    message.reactions = message.reactions.filter(
      r => r.user.toString() !== userId
    );

    // Thêm reaction mới nếu có emoji
    if (emoji?.trim()) {
      message.reactions.push({ user: userId, emoji: emoji.trim() });
    }

    await message.save();

    const populated = await Message.findById(messageId)
      .populate("reactions.user", "firstname lastname avatar");

    res.json({ success: true, reactions: populated.reactions });
  } catch (err) {
    console.error("reactToMessage error:", err);
    res.status(500).json({ msg: "Failed to react to message" });
  }
};

// =============================================
// GET /messages/unread-count
// Số tin nhắn chưa đọc từ tất cả người gửi
// =============================================
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count  = await Message.countDocuments({
      receiver: userId,
      status:   { $ne: "seen" },
      recalled: false,
      deletedFor: { $nin: [userId] }
    });
    res.json({ success: true, count });
  } catch (err) {
    console.error("getUnreadCount error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// POST /messages/media
// Gửi tin nhắn kèm media (ảnh/video) lên Cloudinary
// Accepts: multipart/form-data, field "media" (max 10 files)
// Body: { receiverId, content?, replyTo? }
// =============================================
exports.sendMediaMessage = async (req, res) => {
  try {
    const senderId   = req.user.id;
    const { receiverId, content, replyTo } = req.body;

    if (!receiverId) {
      return res.status(400).json({ msg: "receiverId is required" });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "At least one media file is required" });
    }
    if (req.files.length > 10) {
      return res.status(400).json({ msg: "Maximum 10 files per message" });
    }

    // Build mediaUrls array from uploaded Cloudinary files
    const mediaUrls = req.files.map(file => ({
      url:  file.path,          // Cloudinary URL from multer-storage-cloudinary
      type: file.mimetype.startsWith("video") ? "video" : "image"
    }));

    const msgData = {
      sender:    senderId,
      receiver:  receiverId,
      content:   content?.trim() || "",
      mediaUrls,
      status:    "sent"
    };
    if (replyTo) msgData.replyTo = replyTo;

    const message = await Message.create(msgData);

    const populated = await Message.findById(message._id)
      .populate("sender",   POPULATE_SENDER)
      .populate("receiver", POPULATE_RECEIVER)
      .populate({
        path: "replyTo",
        select: "content sender recalled",
        populate: { path: "sender", select: "firstname lastname" }
      });

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    console.error("sendMediaMessage error:", err);
    res.status(500).json({ msg: "Failed to send media message" });
  }
};

// =============================================
// DELETE /messages/conversation/:partnerId
// Xóa mềm toàn bộ cuộc trò chuyện với partner
// =============================================
exports.deleteConversation = async (req, res) => {
  try {
    const userId    = req.user.id;
    const partnerId = req.params.partnerId;
    const { Types } = require("mongoose");

    await Message.updateMany(
      {
        $or: [
          { sender: userId,    receiver: partnerId },
          { sender: partnerId, receiver: userId    }
        ],
        deletedFor: { $nin: [new Types.ObjectId(userId)] }
      },
      { $push: { deletedFor: userId } }
    );

    res.json({ success: true, msg: "Conversation deleted" });
  } catch (err) {
    console.error("deleteConversation error:", err);
    res.status(500).json({ msg: "Failed to delete conversation" });
  }
};
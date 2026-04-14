const Notification = require("../models/NotificationModel");
const User = require("../models/UserModel");

// ── Helper: format notification thành object gửi về client ───────
function formatNotif(n) {
  const sender = n.sender;
  const senderName = sender
    ? (`${sender.firstname || ""} ${sender.lastname || ""}`).trim() || "Someone"
    : "Someone";
  const avatar = sender?.avatar
    ? sender.avatar.startsWith("http")
      ? sender.avatar
      : `${process.env.BASE_URL || "http://localhost:3000"}/${sender.avatar}`
    : null;

  // ── Meta ─────────────────────────────────────────────────────
  const postId    = n.meta?.postId    ? String(n.meta.postId)    : "";
  const commentId = n.meta?.commentId ? String(n.meta.commentId) : "";
  const orderId   = n.meta?.orderId   ? String(n.meta.orderId)   : "";
  const itemId    = n.meta?.itemId    ? String(n.meta.itemId)    : "";
  const reviewId  = n.meta?.reviewId  ? String(n.meta.reviewId)  : "";
  const shortId   = orderId.slice(-6);

  // ── Order status label ────────────────────────────────────────
  const statusLabels = {
    confirmed:        "✅ Confirmed",
    shipping:         "🚚 Shipping",
    completed:        "📦 Completed",
    cancelled:        "❌ Cancelled",
    refunded:         "💰 Refund Approved",
    "refund rejected": "❌ Refund Rejected",
  };
  const rawStatus   = n.meta?.status || "";
  const statusLabel = statusLabels[rawStatus] || rawStatus;

  // ── Text ──────────────────────────────────────────────────────
  const texts = {
    like_post:        `<b>${senderName}</b> liked your post`,
    like_comment:     `<b>${senderName}</b> liked your comment`,
    like_reply:       `<b>${senderName}</b> liked your reply`,
    comment:          `<b>${senderName}</b> commented on your post`,
    reply:            `<b>${senderName}</b> replied to your comment`,
    share:            `<b>${senderName}</b> shared your post`,
    friend_request:   `<b>${senderName}</b> sent you a friend request`,
    friend_accepted:  `<b>${senderName}</b> accepted your friend request`,
    order_placed:     `Your order <b>#${shortId}</b> has been placed successfully`,
    order_status:     `Order <b>#${shortId}</b>: <b>${statusLabel}</b>`,
    new_order:        `<b>${n.meta?.buyerName || "Someone"}</b> placed order <b>#${shortId}</b>`,
    review:           `<b>${senderName}</b> reviewed <b>${n.meta?.itemName || "your item"}</b>`,
    reply_review:     `Seller replied your review!`,
    order_cancelled:  `Order <b>#${shortId}</b> was cancelled${n.meta?.by ? " by <b>" + n.meta.by + "</b>" : ""}`,
    // Refund
    refund_requested: `<b>${senderName}</b> requested a refund for order <b>#${shortId}</b>`,
    refund_approved:  `Your refund for order <b>#${shortId}</b> has been <b>approved</b> 💰`,
    refund_rejected:  `Your refund for order <b>#${shortId}</b> has been <b>rejected</b> ❌`,

    report_received:  `Your report has been received. We'll review it within 24–48 hours.`,
    report_resolved:  `Your report has been <b>${n.meta?.status === "dismissed" ? "dismissed" : "resolved"}</b>${n.meta?.adminNote ? `: <i>${n.meta.adminNote}</i>` : ""}`,

  };

  // ── Icon ──────────────────────────────────────────────────────
  const icons = {
    like_post: "❤️", like_comment: "❤️", like_reply: "❤️",
    comment: "💬", reply: "↩️", share: "🔁",
    friend_request: "👤", friend_accepted: "🤝",
    order_placed: "🛒", order_status: "📦", new_order: "🛍️",
    review: "⭐",reply_review: "💬", order_cancelled: "❌",
    refund_requested: "🔄", refund_approved: "💰", refund_rejected: "❌", 
    report_received: "🚩", report_resolved: "✅",
  };

  // ── Link ──────────────────────────────────────────────────────
  const links = {
    like_post:        postId ? `/home?postId=${postId}` : null,
    like_comment:     postId ? `/home?postId=${postId}&highlightComment=${commentId}` : null,
    like_reply:       postId ? `/home?postId=${postId}&highlightComment=${commentId}` : null,
    comment:          postId ? `/home?postId=${postId}&highlightComment=${commentId}` : null,
    reply:            postId ? `/home?postId=${postId}&highlightComment=${commentId}` : null,
    share:            postId ? `/home?postId=${postId}` : null,
    friend_request:   "/friend",
    friend_accepted:  sender?._id ? `/profile/${sender._id}` : null,
    order_placed:     orderId ? `/orders/${orderId}` : "/orders",
    order_status:     orderId ? `/orders/${orderId}` : "/orders",
    order_cancelled:  orderId ? `/orders/${orderId}` : "/orders",
    new_order:        orderId ? `/orders/${orderId}` : "/seller-orders",
    review:           itemId
      ? `/marketplace/${itemId}?scrollToReviews=true${reviewId ? "&reviewId=" + reviewId : ""}`
      : "/marketplace",
    reply_review: itemId
      ? `/marketplace/${itemId}?scrollToReviews=true${reviewId ? "&reviewId=" + reviewId : ""}`
      : "/marketplace",  
    // Refund: seller xem request → /seller-orders?tab=refund&orderId=xxx
    // Buyer xem kết quả approve/reject → /orders/:id
    refund_requested: orderId
      ? `/seller-orders?tab=refunds&orderId=${orderId}`
      : "/seller-orders?tab=refunds",
    refund_approved:  orderId ? `/orders/${orderId}` : "/orders",
    refund_rejected:  orderId ? `/orders/${orderId}` : "/orders",
  };

  return {
    id:        n._id,
    type:      n.type,
    text:      texts[n.type] || "",
    icon:      icons[n.type] || "🔔",
    avatar,
    link:      links[n.type] || null,
    read:      n.read,
    createdAt: n.createdAt,
    meta:      n.meta,
  };
}

// ── Core helper: tạo notification + emit socket realtime ──────────
async function createNotification(io, {
  recipientId, senderId = null, type, refId = null, refType = null, meta = {}
}) {
  if (!recipientId || !type) return;
  // Không tự notify chính mình
  if (senderId && String(senderId) === String(recipientId)) return;

  const notif = await Notification.create({
    recipient: recipientId, sender: senderId,
    type, refId, refType, meta
  });

  const populated = await Notification.findById(notif._id)
    .populate("sender", "firstname lastname avatar");

  const formatted = formatNotif(populated);

  // Emit realtime đến recipient
  if (io) {
    io.to(`user:${recipientId}`).emit(`notification:${type}`, {
      ...formatted,
      from: populated.sender
        ? {
            _id: populated.sender._id,
            firstname: populated.sender.firstname,
            lastname: populated.sender.lastname,
            avatar: populated.sender.avatar
          }
        : null
    });
    // Cũng emit event chung để update badge
    io.to(`user:${recipientId}`).emit("notification:new", formatted);
  }

  return populated;
}

// =============================================
// GET /notifications?page=1&limit=20
// Lấy danh sách notifications của user hiện tại
// =============================================
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "firstname lastname avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total  = await Notification.countDocuments({ recipient: userId });
    const unread = await Notification.countDocuments({ recipient: userId, read: false });

    res.json({
      success: true,
      notifications: notifications.map(formatNotif),
      unread,
      total,
      page,
      hasMore: page * limit < total
    });
  } catch (err) {
    console.error("getNotifications:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// PATCH /notifications/read-all
// Mark tất cả là đã đọc
// =============================================
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// PATCH /notifications/:id/read
// Mark 1 notification là đã đọc
// =============================================
exports.markOneRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// GET /notifications/unread-count
// Đếm số notification chưa đọc
// =============================================
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id, read: false
    });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// DELETE /notifications/:id  — Xóa 1 notification
// =============================================
exports.deleteOne = async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// DELETE /notifications  — Xóa tất cả
// =============================================
exports.deleteAll = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// io được inject từ server.js
exports._io = null;
exports._setIO = function(io) { exports._io = io; };

// Wrapper để dùng từ REST controllers (không cần truyền io)
exports.notify = async function(params) {
  return createNotification(exports._io, params);
};

exports.createNotification = createNotification;
exports.formatNotif = formatNotif;
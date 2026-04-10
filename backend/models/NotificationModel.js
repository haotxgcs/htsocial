const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    type: {
      type: String,
      enum: [
        "like_post", "like_comment", "like_reply",
        "comment", "reply",
        "share",
        "friend_request", "friend_accepted",
        "order_placed", "order_status", "new_order",
        "review",
        "order_cancelled",
        "refund_requested", "refund_approved", "refund_rejected",
        "report_received",   // ← thêm
        "report_resolved",
      ],
      required: true
    },
    // Flexible reference
    refId:   { type: mongoose.Schema.Types.ObjectId, default: null }, // postId, orderId, etc.
    refType: { type: String, default: null },                          // 'Post','Order', etc.

    // Extra data
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

// Auto-expire after 60 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 3600 });

module.exports = mongoose.model("Notification", notificationSchema);
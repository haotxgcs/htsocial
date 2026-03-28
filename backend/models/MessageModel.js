const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      default: ""
    },

    // ── Status: sent → delivered → seen ──────────────────────────
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent"
    },
    seenAt: { type: Date, default: null },

    // ── Reply to another message ──────────────────────────────────
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },

    // ── Reactions: [{ user, emoji }] mỗi user 1 reaction ─────────
    reactions: [
      {
        user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String }
      }
    ],

    // ── Recall (thu hồi — hiện "Message recalled" với tất cả) ─────
    recalled: {
      type: Boolean,
      default: false
    },

    // ── Media attachments (Cloudinary URLs) ─────────────────────
    mediaUrls: [
      {
        url:  { type: String },
        type: { type: String, enum: ['image', 'video'] }
      }
    ],

    // ── Soft delete — chỉ ẩn với user đã xóa ────────────────────
    deletedFor: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ]
  },
  { timestamps: true }
);

// Index để query nhanh conversation giữa 2 user
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
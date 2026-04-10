const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // Người report
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Loại đối tượng bị report
    targetType: {
      type: String,
      enum: ["user", "post", "share", "item", "other"],
      required: true,
      index: true
    },

    // ID đối tượng bị report (null nếu là "other")
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true
    },

    // Lý do report
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hate_speech",
        "misinformation",
        "inappropriate_content",
        "fake_account",
        "scam",
        "copyright",
        "other"
      ],
      required: true
    },

    // Mô tả thêm từ user
    description: {
      type: String,
      maxlength: 500,
      default: ""
    },

    // Trạng thái xử lý
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
      index: true
    },

    // Admin ghi chú khi xử lý
    adminNote: {
      type: String,
      default: ""
    },

    // Admin đã xử lý
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Unique: 1 user chỉ report 1 target 1 lần
reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true, sparse: true });

// Auto-expire after 90 days nếu đã resolved/dismissed
reportSchema.index({ resolvedAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600, partialFilterExpression: { status: { $in: ["resolved", "dismissed"] } } });

module.exports = mongoose.model("Report", reportSchema);
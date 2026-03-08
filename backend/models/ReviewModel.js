const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketplaceItem",
      required: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000
    },

    // =============================================
    // SELLER REPLY — 1 lần duy nhất, không sửa
    // =============================================
    sellerReply: {
      content: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
      },
      repliedAt: {
        type: Date,
        default: null
      }
    }
  },
  { timestamps: true }
);

// Index query nhanh + ngăn buyer review trùng (1 user, 1 item, 1 order)
ReviewSchema.index({ item: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, item: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);
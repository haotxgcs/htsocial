const mongoose = require("mongoose");

const MarketplaceItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    // loại hàng bán
    type: {
      type: String,
      enum: ["ingredient", "dish", "tool"],
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    images: {
      type: [String],
      default: []
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    location: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: ["active", "sold", "hidden"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("MarketplaceItem", MarketplaceItemSchema);

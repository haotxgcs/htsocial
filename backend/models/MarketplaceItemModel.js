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

    type: {
      type: String,
      enum: ["ingredient", "dish", "tool"],
      required: true
    },

    condition: {
      type: String,
      enum: ["new", "used"],
      default: "new"
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0   // ✅ QUAN TRỌNG
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
    },

    soldCount: {
      type: Number,
      default: 0
    },

    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
  },
  { timestamps: true }
);

/**
 * 🔥 AUTO UPDATE STATUS BASED ON QUANTITY
 */
MarketplaceItemSchema.pre("save", function (next) {
  if (this.quantity <= 0) {
    this.quantity = 0;
    this.status = "sold";
  } else if (this.status === "sold") {
    this.status = "active";
  }
  next();
});

module.exports = mongoose.model("MarketplaceItem", MarketplaceItemSchema);

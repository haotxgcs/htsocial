const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MarketplaceItem",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true
        },
        itemSnapshot: { 
          title: String,
          images: [String],
          seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
          }
        },
        sellerStatus: {
          type: String,
          enum: ["pending", "confirmed", "shipping", "completed", "cancelled", "refunded"],
          default: "pending"
        },

        reviewed: { type: Boolean, default: false },
      }
    ],


    totalPrice: {
      type: Number,
      required: true
    },

    // ✅ SNAPSHOT ĐỊA CHỈ TẠI THỜI ĐIỂM ĐẶT HÀNG
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true }
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "completed", "cancelled","refunded"],
      default: "pending"
    },
    
    note: {
      type: String,
      default: ""
    },

    refund: {
      status: {
        type: String,
        enum: ["none", "requested", "approved", "rejected", "refunded"],
        default: "none"
      },

      reason: {
        type: String,
        default: ""
      },

      stripeRefundId: {
        type: String,
        default: null
      },

      evidence: {
        images: {
          type: [String],
          default: []
        },
        videos: {
          type: [String],
          default: []
        }
      },

      requestedAt: {type: Date},
      resolvedAt: {type: Date},

      resolvedBy: {
        type: String,
        enum: ["seller", "admin"],
        default: null
      },

      rejectReason: {type: String, default:""}
    },


    payment: {
      method: {
        type: String,
        enum: ["cod", "online"],
        default: "cod"
      },
      status: {
        type: String,
        enum: ["unpaid", "paid", "refund-pending", "refunded"],
        default: "unpaid"
      },

      stripePaymentIntentId: {
        type: String
      }
    },

    paidAt: {
      type: Date
    },

    cancelledAt: {
      type: Date
    },

    cancelledBy: {
      type: String,
      enum: ["buyer", "seller", "admin"]
    },
    cancelReason: {
      type: String
    },

  },
  { timestamps: true, versionKey : false }
);

module.exports = mongoose.model("Order", OrderSchema);

const Order = require("../models/OrderModel");
const { notify } = require("./NotificationController");
const MarketplaceItem = require("../models/MarketplaceItemModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { sendCODRefundEmail } = require("../services/emailService");


/**
 * ======================================================
 * BUYER REQUEST REFUND
 * POST /refund/request/:orderId
 * ======================================================
 */
exports.requestRefund = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;
    const orderId = req.params.orderId;

    // ✅ 1. Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    // ✅ 2. Only buyer
    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "Not allowed"
      });
    }

    // ✅ 3. Online orders must be paid
    if (order.payment.method === "online" && order.payment.status !== "paid") {
      return res.status(400).json({
        success: false,
        msg: "Only paid online orders can request refund"
      });
    }

    // ✅ 4. Prevent duplicate refund
    if (
      order.refund.status !== "none" &&
      order.refund.status !== "rejected"
    ) {
      return res.status(400).json({
        success: false,
        msg: "Refund request already exists"
      });
    }

    // ✅ 5. Refund allowed only confirmed/shipping/completed
    if (!["confirmed", "shipping", "completed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        msg: "Refund not allowed for this order status"
      });
    }

    /**
     * ✅ 6. Refund window: Only within 7 days after completed
     */
    if (order.status === "completed") {
      const completedDate = order.updatedAt; // hoặc completedAt nếu có

      const daysPassed =
        (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysPassed > 7) {
        return res.status(400).json({
          success: false,
          msg: "Refund period expired (7 days limit)"
        });
      }
    }

    /**
     * ✅ 7. Evidence required ONLY if completed
     */
    if (order.status === "completed") {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          msg: "Evidence is required for completed orders"
        });
      }
    }

    /**
     * ✅ 8. Evidence upload to Cloudinary
     * file.path = Cloudinary URL
     */
    let images = [];
    let videos = [];

    if (req.files && req.files.length > 0) {
      images = req.files
        .filter(f => f.mimetype.startsWith("image"))
        .map(f => f.path); // ✅ Cloudinary URL

      videos = req.files
        .filter(f => f.mimetype.startsWith("video"))
        .map(f => f.path); // ✅ Cloudinary URL
    }

    /**
     * ✅ 9. Save refund request
     */
    order.refund = {
      status: "requested",
      reason: reason?.trim() || "No reason provided",
      stripeRefundId: null,
      evidence: { images, videos },
      requestedAt: new Date()
    };

    await order.save();

    // Notify seller: buyer gửi refund request
    await notify({
      recipientId: order.seller,
      senderId:    userId,
      type:        "refund_requested",
      refId:       order._id,
      refType:     "Order",
      meta:        { orderId: order._id }
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      msg:
        order.status === "completed"
          ? "Refund request submitted ✅ Evidence uploaded"
          : "Refund request submitted ✅",
      refund: order.refund
    });

  } catch (err) {
    console.error("Refund request error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};




/**
 * ======================================================
 * SELLER APPROVE REFUND
 * PATCH /refund/approve/:orderId
 * ======================================================
 */
exports.approveRefund = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const order = await Order.findById(req.params.orderId).populate("user", "firstname lastname email");

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    // ✅ Must be requested
    if (order.refund.status !== "requested") {
      return res.status(400).json({
        success: false,
        msg: "No refund request found"
      });
    }

    // ✅ Only seller of this order
    if (order.seller.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        msg: "Not allowed"
      });
    }

    // ✅ Calculate total refund
    const subtotal = order.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    // ✅ Restock only if order is still shipping
    const allowRestock = order.status === "shipping";

    /**
     * ✅ Online refund → Stripe
     */
    if (order.payment.method === "online") {
      if (order.payment.status !== "paid") {
        return res.status(400).json({
          success: false,
          msg: "Cannot refund unpaid order"
        });
      }

      const stripeRefund = await stripe.refunds.create({
        payment_intent: order.payment.stripePaymentIntentId,
        amount: Math.round(subtotal * 100)
      });

      order.payment.status = "refund-pending";
      order.refund.stripeRefundId = stripeRefund.id;
    }

    /**
     * ✅ COD refund → manual
     */
    if (order.payment.method === "cod") {
      order.payment.status = "refunded";
    }

    /**
     * ✅ Restock quantity ONLY if shipping
     */
    if (allowRestock) {
      for (const i of order.items) {
        await MarketplaceItem.findByIdAndUpdate(i.item, {
          $inc: { quantity: i.quantity }
        });
      }
    }

    // ✅ Update refund info
    order.refund.status = "approved";
    order.refund.resolvedBy = "seller";
    order.refund.resolvedAt = new Date();

    // ✅ COD refund done immediately
    if (order.payment.method === "cod") {
      order.refund.status = "refunded";
      order.status = "refunded";
    }

    if (order.payment.method === "online") {
      order.status = "refunded";
    }

    await order.save();

    // COD: gui email thong bao thu tien mat trong 24h
    if (order.payment.method === "cod") {
      try { await sendCODRefundEmail(order); } catch (e) { console.error("COD refund email error:", e); }
    }

    // Notify buyer: refund được approve
    await notify({
      recipientId: order.user._id || order.user,
      senderId:    sellerId,
      type:        "refund_approved",
      refId:       order._id,
      refType:     "Order",
      meta:        { orderId: order._id }
    }).catch(() => {});

    return res.json({
      success: true,
      msg:
        order.payment.method === "online"
          ? "Refund approved ✅ Stripe processing..."
          : "Refund approved ✅ COD refunded",
      refund: order.refund
    });

  } catch (err) {
    console.error("Approve refund error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};



/**
 * ======================================================
 * SELLER REJECT REFUND
 * PATCH /refund/reject/:orderId
 * ======================================================
 */
exports.rejectRefund = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { rejectReason } = req.body;

    const order = await Order.findById(req.params.orderId);

    if (!order)
      return res.status(404).json({ success: false, msg: "Order not found" });

    // ✅ Seller items only
    const sellerItems = order.items.filter(
      i => i.itemSnapshot.seller.toString() === sellerId
    );

    if (sellerItems.length === 0)
      return res.status(403).json({
        success: false,
        msg: "Not allowed"
      });

    if (!order.refund || order.refund.status !== "requested")
      return res.status(400).json({
        success: false,
        msg: "No refund request found"
      });

    // ✅ Reject refund
    order.refund.status = "rejected";
    order.refund.resolvedBy = "seller";
    order.refund.resolvedAt = new Date();
    order.refund.rejectReason = rejectReason || "Refund rejected";

    await order.save();

    // Notify buyer: refund bị reject
    await notify({
      recipientId: order.user,
      senderId:    sellerId,
      type:        "refund_rejected",
      refId:       order._id,
      refType:     "Order",
      meta:        { orderId: order._id }
    }).catch(() => {});

    res.json({
      success: true,
      msg: "Refund rejected successfully ✅",
      refund: order.refund
    });

  } catch (err) {
    console.error("Reject refund error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

exports.getRefundsForBuyer = async (req, res) => {
  try {

    const userId = req.user.id;

    const orders = await Order.find({
      user: userId,
      "refund.status": { $in: ["requested", "approved", "rejected", "refunded"] }
    })
    .populate("items.item","title images price")
    .select("refund items totalPrice createdAt");

    const refunds = orders.map(order => ({
      orderId: order._id,
      items: order.items,
      refund: order.refund,
      createdAt: order.createdAt
    }));

    res.json({
      success:true,
      refunds
    });

  } catch (err) {

    console.error("Get refunds for buyer error:", err);

    res.status(500).json({
      success:false,
      msg:"Server error"
    });

  }
};

exports.getRefundsForSeller = async (req, res) => {
  try {

    const sellerId = req.user.id;

    const orders = await Order.find({
      seller: sellerId,
      "refund.status": { $in: ["requested", "approved", "rejected", "refunded"] }
    })
    .populate("user", "firstname lastname email avatar")
    .populate("items.item", "title images price")
    .select("refund items user totalPrice payment createdAt");

    const refunds = orders.map(order => ({
      orderId: order._id,
      buyer: order.user,
      items: order.items,
      refund: order.refund,
      payment: order.payment,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt
    }));

    res.json({
      success:true,
      refunds
    });

  } catch (err) {

    console.error("Get refunds for seller error:", err);

    res.status(500).json({
      success:false,
      msg:"Server error"
    });

  }
};
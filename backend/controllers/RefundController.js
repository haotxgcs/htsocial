const Order = require("../models/OrderModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * =====================================
 * BUYER REQUEST REFUND
 * =====================================
 * POST /refund/:orderId/request
 */
exports.requestRefund = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;
    const orderId = req.params.orderId;

    // ===== 1. LOAD ORDER =====
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    // ===== 2. ONLY BUYER CAN REQUEST =====
    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "You are not allowed to request refund for this order"
      });
    }

    // ===== 3. ONLY SHIPPING / COMPLETED =====
    if (!["shipping", "completed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        msg: "Refund is only available after order is shipping/completed"
      });
    }

    // ===== 4. PREVENT DUPLICATE REFUND =====
    if (order.refund && order.refund.status === "requested") {
      return res.status(400).json({
        success: false,
        msg: "Refund request already exists"
      });
    }

    // ===== 5. EVIDENCE REQUIRED =====
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Refund evidence (images/videos) is required"
      });
    }

    // ===== 6. FILES PROCESSING =====
    const images = req.files
      .filter(f => f.mimetype.startsWith("image"))
      .map(f => `uploads/${f.filename}`);

    const videos = req.files
      .filter(f => f.mimetype.startsWith("video"))
      .map(f => `uploads/${f.filename}`);

    if (images.length === 0 && videos.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Evidence must include at least 1 image/video"
      });
    }

    // ===== 7. SAVE REFUND REQUEST =====
    order.refund = {
      status: "requested",
      reason: reason?.trim() || "No reason provided",
      evidence: { images, videos },
      requestedAt: new Date()
    };

    await order.save();

    res.json({
      success: true,
      msg: "Refund request submitted successfully",
      refund: order.refund
    });

  } catch (err) {
    console.error("Refund request error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};

/**
 * =====================================
 * SELLER APPROVE REFUND
 * =====================================
 * POST /refund/:orderId/approve
 */
exports.approveRefund = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (!order.refund || order.refund.status !== "requested") {
      return res.status(400).json({ msg: "No refund request found" });
    }

    if (order.refund.status === "approved") {
      return res.status(400).json({ msg: "Refund already approved" });
    }

    // ✅ Seller items only
    const sellerItems = order.items.filter(
      i => i.itemSnapshot.seller.toString() === sellerId
    );

    if (sellerItems.length === 0) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    // ✅ Refund only seller subtotal
    const sellerSubtotal = sellerItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    // ✅ Stripe refund
    if (order.payment.method === "online") {
      await stripe.refunds.create({
        payment_intent: order.payment.stripePaymentIntentId,
        amount: sellerSubtotal * 100
      });

      order.payment.status = "refunded";
    }

    // ✅ Restore stock
    for (const i of sellerItems) {
      await MarketplaceItem.findByIdAndUpdate(i.item, {
        $inc: { quantity: i.quantity }
      });
    }

    // ✅ Refund update
    order.refund.status = "approved";
    order.refund.resolvedBy = "seller";
    order.refund.resolvedAt = new Date();

    // ✅ Order status update
    order.status = "refunded";

    await order.save();

    res.json({
      success: true,
      msg: "Refund approved successfully",
      refund: order.refund
    });

  } catch (err) {
    console.error("Approve refund error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


/**
 * =====================================
 * SELLER REJECT REFUND
 * =====================================
 * POST /refund/:orderId/reject
 */
exports.rejectRefund = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { rejectReason } = req.body;

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const sellerItems = order.items.filter(
      i => i.itemSnapshot.seller.toString() === sellerId
    );

    if (sellerItems.length === 0) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    if (!order.refund || order.refund.status !== "requested") {
      return res.status(400).json({ msg: "No refund request found" });
    }

    order.refund.status = "rejected";
    order.refund.resolvedBy = "seller";
    order.refund.resolvedAt = new Date();
    order.refund.rejectReason = rejectReason || "Refund rejected";

    await order.save();

    res.json({
      success: true,
      msg: "Refund rejected successfully",
      refund: order.refund
    });

  } catch (err) {
    console.error("Reject refund error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

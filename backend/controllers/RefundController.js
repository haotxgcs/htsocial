const Order = require("../models/OrderModel");
const MarketplaceItem = require("../models/MarketplaceItemModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// =============================================
// EMAIL: COD Refund Approved
// =============================================
async function sendCODRefundEmail(order) {
  const brand      = "#ff5757";
  const brandLight = "#fff3ee";
  const textDark   = "#1a1a1a";
  const textGray   = "#666666";
  const borderCol  = "#eeeeee";

  await transporter.sendMail({
    from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
    to: order.user.email,
    subject: "Refund Approved — You Will Receive Cash Within 24 Hours",
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:36px auto 60px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <div style="background:${brand};padding:26px 28px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#fff;">HT Social Marketplace</div>
    <div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,0.82);">Refund Notice</div>
  </div>

  <div style="padding:32px 28px 24px;text-align:center;border-bottom:1px solid ${borderCol};">
    <div style="font-size:40px;margin-bottom:10px;">💵</div>
    <h2 style="margin:0 0 10px;font-size:20px;color:${textDark};font-weight:700;">Refund Approved!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:${textGray};line-height:1.6;">
      Hi <strong>${order.user.firstname} ${order.user.lastname}</strong>,<br/>
      your refund request has been approved by the seller.
    </p>
    <div style="display:inline-block;background:#f5f5f5;border-radius:8px;padding:8px 20px;font-size:13px;color:${textGray};">
      Order ID:&nbsp;<strong style="color:${textDark};font-family:monospace;font-size:14px;">#${order._id.toString().slice(-8).toUpperCase()}</strong>
    </div>
  </div>

  <div style="padding:24px 28px;border-bottom:1px solid ${borderCol};">
    <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:${textGray};">Payment Method</td>
        <td align="right"><span style="background:#e8f5e9;color:#27ae60;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid #a5d6a7;">Cash on Delivery</span></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${textGray};border-top:1px solid ${borderCol};">Refund Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right"><span style="background:#e8f5e9;color:#27ae60;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Approved</span></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${textGray};border-top:1px solid ${borderCol};">Order Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right"><span style="background:${brandLight};color:${brand};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid #ffd0c0;text-transform:uppercase;">Refunded</span></td>
      </tr>
    </table>
  </div>

  <div style="margin:20px 28px 8px;background:#e8f5e9;border-radius:12px;padding:18px 22px;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-size:15px;font-weight:600;color:${textDark};">Amount to be Refunded</td>
        <td align="right" style="font-size:24px;font-weight:800;color:#27ae60;">$${Number(order.totalPrice).toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <div style="margin:12px 28px 28px;padding:14px 18px;background:#f0fff4;border-radius:10px;border-left:3px solid #a5d6a7;font-size:13px;color:#2e7d32;line-height:1.6;">
    🕐 The seller will return your cash payment <strong>within 24 hours</strong>.
    Please contact the seller if you have not received it after that time.
  </div>

  <div style="padding:0 28px 28px;text-align:center;">
    <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/orders/${order._id}"
      style="display:inline-block;padding:14px 32px;background:${brand};color:#fff;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;">
      View Order Details
    </a>
  </div>

  <div style="background:#fafafa;border-top:1px solid ${borderCol};padding:18px 28px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;color:${textGray};">Questions? Contact our support team.</p>
    <p style="margin:0;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} HT Social Marketplace. All rights reserved.</p>
  </div>

</div>
</body>
</html>`
  });
}


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
      "refund.status": { $in: ["requested", "approved", "rejected"] }
    })
    .populate("items.item","title images price")
    .select("refund items createdAt");

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
      "items.itemSnapshot.seller": sellerId,
      "refund.status": { $in: ["requested", "approved", "rejected"] }
    })
    .populate("user","firstname lastname email avatar")
    .populate("items.item","title images price")
    .select("refund items user createdAt");

    const refunds = orders.map(order => ({
      orderId: order._id,
      buyer: order.user,
      items: order.items,
      refund: order.refund,
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
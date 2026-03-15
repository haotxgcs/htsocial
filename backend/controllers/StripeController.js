const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/OrderModel");
const nodemailer = require("nodemailer");

/**
 * ✅ Mail Transporter
 */
const fmtPrice = (v) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * ✅ Send Payment Success Email
 */
async function sendOrderPaidEmail(order) {
  const brand      = "#ff5757";
  const brandLight = "#fff3ee";
  const textDark   = "#1a1a1a";
  const textGray   = "#666666";
  const borderCol  = "#eeeeee";

  await transporter.sendMail({
    from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
    to: order.user.email,
    subject: "Payment Successful — Order Confirmed",
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:36px auto 60px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <div style="background:${brand};padding:26px 28px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#fff;">HT Social Marketplace</div>
    <div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,0.82);">Payment Receipt</div>
  </div>

  <div style="padding:32px 28px 24px;text-align:center;border-bottom:1px solid ${borderCol};">
    <div style="font-size:40px;margin-bottom:10px;">✅</div>
    <h2 style="margin:0 0 10px;font-size:20px;color:${textDark};font-weight:700;">Payment Successful!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:${textGray};line-height:1.6;">
      Hi <strong>${order.user.firstname} ${order.user.lastname}</strong>,<br/>
      your payment has been received and your order is now confirmed.
    </p>
    <div style="display:inline-block;background:#f5f5f5;border-radius:8px;padding:8px 20px;font-size:13px;color:${textGray};">
      Order ID:&nbsp;<strong style="color:${textDark};font-family:monospace;font-size:14px;">#${order._id.toString().slice(-6)}</strong>
    </div>
  </div>

  <div style="padding:24px 28px;border-bottom:1px solid ${borderCol};">
    <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:${textGray};">Payment Method</td>
        <td align="right"><span style="background:#fff3e0;color:#e67e22;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid #f0c07a;">Online Payment (Stripe)</span></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${textGray};border-top:1px solid ${borderCol};">Payment Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right"><span style="background:#e8f5e9;color:#27ae60;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Paid</span></td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:${textGray};border-top:1px solid ${borderCol};">Order Status</td>
        <td style="border-top:1px solid ${borderCol};" align="right"><span style="background:${brandLight};color:${brand};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid #ffd0c0;text-transform:uppercase;">Confirmed</span></td>
      </tr>
    </table>
  </div>

  <div style="margin:20px 28px 24px;background:${brandLight};border-radius:12px;padding:18px 22px;">
    <table width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="font-size:15px;font-weight:600;color:${textDark};">Total Paid</td>
        <td align="right" style="font-size:24px;font-weight:800;color:${brand};">${fmtPrice(order.totalPrice)}</td>
      </tr>
    </table>
  </div>

  <div style="padding:0 28px 28px;text-align:center;">
    <a href="${process.env.CLIENT_URL || "http://localhost:8080"}/orders/${order._id}"
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
async function sendRefundSuccessEmail(order) {
  const brand      = "#ff5757";
  const brandLight = "#fff3ee";
  const textDark   = "#1a1a1a";
  const textGray   = "#666666";
  const borderCol  = "#eeeeee";

  await transporter.sendMail({
    from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
    to: order.user.email,
    subject: "Refund Completed Successfully",
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:36px auto 60px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <div style="background:${brand};padding:26px 28px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#fff;">HT Social Marketplace</div>
    <div style="margin-top:5px;font-size:13px;color:rgba(255,255,255,0.82);">Refund Receipt</div>
  </div>

  <div style="padding:32px 28px 24px;text-align:center;border-bottom:1px solid ${borderCol};">
    <div style="font-size:40px;margin-bottom:10px;">💸</div>
    <h2 style="margin:0 0 10px;font-size:20px;color:${textDark};font-weight:700;">Refund Processed!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:${textGray};line-height:1.6;">
      Hi <strong>${order.user.firstname} ${order.user.lastname}</strong>,<br/>
      your refund has been processed successfully.
    </p>
    <div style="display:inline-block;background:#f5f5f5;border-radius:8px;padding:8px 20px;font-size:13px;color:${textGray};">
      Order ID:&nbsp;<strong style="color:${textDark};font-family:monospace;font-size:14px;">#${order._id.toString().slice(-6)}</strong>
    </div>
  </div>

  <div style="padding:24px 28px;border-bottom:1px solid ${borderCol};">
    <table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
      <tr>
        <td style="padding:8px 0;color:${textGray};">Refund Status</td>
        <td align="right"><span style="background:#e8f5e9;color:#27ae60;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">Refunded</span></td>
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
        <td style="font-size:15px;font-weight:600;color:${textDark};">Amount Refunded</td>
        <td align="right" style="font-size:24px;font-weight:800;color:#27ae60;">${fmtPrice(order.totalPrice)}</td>
      </tr>
    </table>
  </div>

  <div style="margin:12px 28px 28px;padding:14px 18px;background:#f0fff4;border-radius:10px;border-left:3px solid #a5d6a7;font-size:13px;color:#2e7d32;line-height:1.6;">
    The refunded amount will be returned to your original payment method within <strong>5–7 business days</strong>.
  </div>

  <div style="padding:0 28px 28px;text-align:center;">
    <a href="${process.env.CLIENT_URL || "http://localhost:8080"}/orders/${order._id}"
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
 * ✅ STRIPE WEBHOOK COMPLETE
 * ======================================================
 */
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  /**
   * ✅ 1. Payment Success
   */
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    const order = await Order.findById(orderId).populate("user");

    if (order && order.payment.status !== "paid") {
      order.payment.status = "paid";
      order.payment.method = "online";
      order.payment.stripePaymentIntentId = paymentIntent.id;
      order.status = "confirmed";
      order.paidAt = new Date();

      await order.save();
      await sendOrderPaidEmail(order);

      console.log("✅ Order paid + email sent:", order._id);
    }
  }

  /**
   * ✅ 2. Refund Completed
   */
  if (event.type === "charge.refunded") {
    const charge = event.data.object;

    const order = await Order.findOne({
      "payment.stripePaymentIntentId": charge.payment_intent
    }).populate("user");

    if (order) {
      order.payment.status = "refunded";
      order.refund.status = "refunded";
      order.refund.resolvedAt = new Date();

      await order.save();
      await sendRefundSuccessEmail(order);

      console.log("✅ Refund completed + email sent:", order._id);
    }
  }

  /**
   * ✅ 3. Refund Failed
   */
  if (event.type === "charge.refund.updated") {
    const refund = event.data.object;

    if (refund.status === "failed") {
      console.log("❌ Refund failed:", refund.id);
    }
  }

  res.json({ received: true });
};

/**
 * ======================================================
 * ✅ CREATE PAYMENT INTENT (CARD ONLY)
 * ======================================================
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ msg: "Order not found" });

    // ✅ Prevent COD payment intent
    if (order.payment.method !== "online") {
      return res.status(400).json({
        msg: "This order is COD, Stripe payment not required."
      });
    }

    // ✅ Create intent (Card Only)
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100),
      currency: "usd",
      payment_method_types: ["card"],
      metadata: { orderId: order._id.toString() }
    });

    order.payment.stripePaymentIntentId = intent.id;
    await order.save();

    res.json({ clientSecret: intent.client_secret });

  } catch (err) {
    res.status(500).json({
      msg: "Stripe error",
      error: err.message
    });
  }
};
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/OrderModel");
const nodemailer = require("nodemailer");

/**
 * ✅ Mail Transporter
 */
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
  await transporter.sendMail({
    from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
    to: order.user.email,
    subject: "✅ Payment Successful - Order Confirmed",

    html: `
      <div style="font-family:Arial;background:#f6f6f6;padding:40px;">
        <div style="max-width:600px;margin:auto;background:white;
          border-radius:14px;overflow:hidden;
          box-shadow:0 6px 18px rgba(0,0,0,0.15);">

          <div style="background:#ff5757;color:white;
            padding:20px;text-align:center;
            font-size:24px;font-weight:bold;">
            HT Social
          </div>

          <div style="padding:35px;text-align:center;">
            <h2>Thank you for your purchase ✅</h2>
            <p>Hello <b>${order.user.firstname} ${order.user.lastname}</b>, your payment was successful!</p>
            <p><b>Order ID:</b> ${order._id}</p>
            <p><b>Total Paid:</b> $${order.totalPrice}</p>

            <a href="http://localhost:8080/orders/${order._id}"
              style="display:inline-block;margin-top:20px;
              padding:14px 26px;
              background:#ff5757; color:white;
              border-radius:10px;text-decoration:none;">
              View Order Details
            </a>
          </div>

          <div style="background:#fafafa;padding:15px;
            text-align:center;font-size:12px;color:#888;">
            © ${new Date().getFullYear()} HT Social Marketplace. All rights reserved.
          </div>
        </div>
      </div>
    `
  });
}

/**
 * ✅ Send Refund Success Email
 */
async function sendRefundSuccessEmail(order) {
  await transporter.sendMail({
    from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
    to: order.user.email,
    subject: "✅ Refund Completed Successfully",

    html: `
      <div style="font-family:Arial;background:#f6f6f6;padding:40px;">
        <div style="max-width:600px;margin:auto;background:white;
          border-radius:14px;overflow:hidden;
          box-shadow:0 6px 18px rgba(0,0,0,0.15);">

          <div style="background:#ff5757 ;color:white;
            padding:20px;text-align:center;
            font-size:24px;font-weight:bold;">
            HT Social
          </div>

          <div style="padding:35px;text-align:center;">
            <h2>Your refund has been processed ✅</h2>

            <p>Order <b>${order._id}</b> has been refunded successfully.</p>
            <p>Status: <b>Refunded</b></p>

            <p style="color:#555;font-size:14px;">
              The refunded amount will return to your bank/card soon.
            </p>
          </div>

          <div style="background:#fafafa;padding:15px;
            text-align:center;font-size:12px;color:#888;">
            © ${new Date().getFullYear()} HT Social Marketplace. All rights reserved.
          </div>
        </div>
      </div>
    `
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

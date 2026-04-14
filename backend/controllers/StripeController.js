const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/OrderModel");
const { sendOrderPaidEmail, sendStripeRefundEmail } = require("../services/emailService");


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

      // Set estimated delivery date (default 7 days, or keep seller-set value)
      const deliveryDays = order.estimatedDeliveryDays || 7;
      order.estimatedDeliveryDays = deliveryDays;
      order.estimatedDeliveryDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);

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
      await sendStripeRefundEmail(order);

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
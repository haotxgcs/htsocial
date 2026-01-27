const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/OrderModel");

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
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;

    const order = await Order.findOne({
      "payment.stripePaymentIntentId": intent.id
    });

    if (order) {
      order.payment.status = "paid";
      order.paidAt = new Date();
      await order.save();
    }
  }

  res.json({ received: true });
};

exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100),
      currency: "usd",
      metadata: {
        orderId: order._id.toString()
      }
    });

    order.payment.stripePaymentIntentId = intent.id;
    await order.save();

    res.json({
      clientSecret: intent.client_secret
    });
  } catch (err) {
    res.status(500).json({ msg: "Stripe error" });
  }
};


const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { 
    stripeWebhook, 
    createPaymentIntent
} = require("../controllers/StripeController");

router.post("/webhook",auth, stripeWebhook);
router.post("/create-intent", auth, createPaymentIntent);

module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createPaymentIntent
} = require("../controllers/StripeController");

/**
 * ✅ Create Payment Intent (Online payment)
 */
router.post("/create-intent", auth, createPaymentIntent);

module.exports = router;

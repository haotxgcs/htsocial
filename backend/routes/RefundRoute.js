const express = require("express");
const router = express.Router();
const  auth  = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// ✅ IMPORT ĐÚNG callback function
const {
  requestRefund,
  approveRefund,
  rejectRefund
} = require("../controllers/RefundController");

// ✅ Buyer request refund
router.post(
  "/request/:orderId",
  auth,
  upload.array("evidence", 5),
  requestRefund
);

// ✅ Seller approve refund
router.patch(
  "/approve/:orderId",
  auth,
  approveRefund
);

router.patch(
  "/reject/:orderId",
  auth,
  rejectRefund
)

module.exports = router;

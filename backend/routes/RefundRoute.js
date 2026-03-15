const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const uploadCloud = require("../middleware/uploadCloudinary");
const { uploadEvidence } = require("../middleware/uploadCloudinary");

const {
  requestRefund,
  approveRefund,
  rejectRefund,
  getRefundsForSeller,
  getRefundsForBuyer
} = require("../controllers/RefundController");

/**
 * ✅ Buyer Request Refund
 * POST /refund/request/:orderId
 */
router.post(
  "/request/:orderId",
  auth,
  uploadEvidence.array("evidence", 5),
  requestRefund
);

/**
 * ✅ Seller Approve Refund
 * PATCH /refund/approve/:orderId
 */
router.patch("/approve/:orderId", auth, approveRefund);

/**
 * ✅ Seller Reject Refund
 * PATCH /refund/reject/:orderId
 */
router.patch("/reject/:orderId", auth, rejectRefund);

router.get("/seller-refunds",auth, getRefundsForSeller);
router.get("/buyer-refunds",auth, getRefundsForBuyer);


module.exports = router;
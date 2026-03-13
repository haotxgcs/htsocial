const router = require("express").Router();
const auth   = require("../middleware/authMiddleware");

const {
  getReviewsByItem,
  getReviewsBySeller,
  getMyReviews,
  canReviewItem,
  replyToReview,
  deleteReply,
  updateReview,
  deleteReview,
} = require("../controllers/ReviewController");

// ─── Public ───────────────────────────────────────
// Lấy review theo item (cho trang sản phẩm)
router.get("/item/:itemId", getReviewsByItem);

// ─── Auth — Buyer ─────────────────────────────────
// Lấy tất cả review của buyer đang đăng nhập
router.get("/my", auth, getMyReviews);

// Kiểm tra buyer có được review item này không
router.get("/can-review/:itemId", auth, canReviewItem);

// ─── Auth — Seller ────────────────────────────────
// Lấy tất cả review của các item thuộc seller
router.get("/seller", auth, getReviewsBySeller);

// Reply / cập nhật reply cho review
router.post("/:reviewId/reply", auth, replyToReview);

router.delete("/:reviewId/reply", auth, deleteReply);

// ─── Auth — Buyer (dynamic :reviewId — đặt sau các static routes) ─
// Sửa review (buyer, chủ review, trong 30 ngày)
router.put("/:reviewId", auth, updateReview);

// Xóa review (buyer, chủ review) + reset reviewed flag
router.delete("/:reviewId", auth, deleteReview);

module.exports = router;
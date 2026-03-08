const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getReviewsByItem,getReviewsBySeller, canReviewItem, replyToReview } = require("../controllers/ReviewController");

// Public — lấy danh sách review theo item
router.get("/item/:itemId", getReviewsByItem);


// Auth — kiểm tra user có được review item này không
router.get("/can-review/:itemId", auth, canReviewItem);


// Auth — seller reply 1 lần duy nhất
router.post("/:reviewId/reply", auth, replyToReview);
router.get("/seller", auth, getReviewsBySeller);

module.exports = router;
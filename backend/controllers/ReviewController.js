const Review          = require("../models/ReviewModel");
const { notify } = require("./NotificationController");
const Order           = require("../models/OrderModel");
const MarketplaceItem = require("../models/MarketplaceItemModel");

// =============================================
// HELPER — Tính lại rating.average + rating.count
// Gọi sau mỗi thao tác thay đổi rating: update, delete
// =============================================
async function recalcItemRating(itemId) {
  const reviews = await Review.find({ item: itemId }).select("rating");

  const count   = reviews.length;
  const average = count > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
    : 0;

  await MarketplaceItem.findByIdAndUpdate(itemId, {
    "rating.average": Math.round(average * 10) / 10, // 1 chữ số thập phân
    "rating.count":   count
  });
}

// =============================================
// GET /reviews/item/:itemId         — Public
// =============================================
exports.getReviewsByItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const reviews = await Review.find({ item: itemId })
      .populate("user", "firstname lastname avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, total: reviews.length, reviews });
  } catch (err) {
    console.error("getReviewsByItem error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// =============================================
// GET /reviews/seller               — Auth (seller)
// =============================================
exports.getReviewsBySeller = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const reviews = await Review.find()
      .populate({
        path:  "item",
        select: "title images price seller",
        match: { seller: sellerId }
      })
      .populate("user", "firstname lastname avatar")
      .sort({ createdAt: -1 });

    // populate match không loại bỏ document, chỉ set item = null
    const filtered = reviews.filter(r => r.item !== null);

    res.json({ success: true, total: filtered.length, reviews: filtered });
  } catch (err) {
    console.error("getReviewsBySeller error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// =============================================
// GET /reviews/can-review/:itemId   — Auth (buyer)
// =============================================
exports.canReviewItem = async (req, res) => {
  try {
    const userId     = req.user.id;
    const { itemId } = req.params;

    const order = await Order.findOne({
      user:             userId,
      status:           "completed",
      "items.item":     itemId,
      "items.reviewed": { $ne: true }
    }).select("_id items");

    if (!order) return res.json({ canReview: false, orderId: null });

    const orderItem = order.items.find(
      i => i.item.toString() === itemId && !i.reviewed
    );
    if (!orderItem) return res.json({ canReview: false, orderId: null });

    const alreadyReviewed = await Review.findOne({
      user: userId, item: itemId, order: order._id
    });
    if (alreadyReviewed) return res.json({ canReview: false, orderId: null });

    res.json({ canReview: true, orderId: order._id });
  } catch (err) {
    console.error("canReviewItem error:", err);
    res.status(500).json({ canReview: false, orderId: null });
  }
};

// =============================================
// GET /reviews/my                   — Auth (buyer)
// =============================================
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.find({ user: userId })
      .populate("item", "title images price")
      .sort({ createdAt: -1 });

    res.json({ success: true, total: reviews.length, reviews });
  } catch (err) {
    console.error("getMyReviews error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// =============================================
// PUT /reviews/:reviewId            — Auth (buyer)
// Sửa rating + comment, xóa sellerReply
// ✅ Sau khi save → recalcItemRating
// =============================================
exports.updateReview = async (req, res) => {
  try {
    const userId       = req.user.id;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, msg: "Rating must be between 1 and 5" });
    }

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, msg: "Review not found" });

    if (review.user.toString() !== userId) {
      return res.status(403).json({ success: false, msg: "You can only edit your own reviews" });
    }

    const daysSince = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) {
      return res.status(400).json({ success: false, msg: "Reviews can only be edited within 30 days of posting" });
    }

    review.rating    = rating;
    review.comment   = comment?.trim() || "";
    review.updatedAt = new Date();
    if (review.sellerReply?.repliedAt) review.sellerReply = undefined;

    await review.save();

    // ✅ Cập nhật rating.average + rating.count của item
    await recalcItemRating(review.item);

    res.json({ success: true, msg: "Review updated successfully", review });
  } catch (err) {
    console.error("updateReview error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// =============================================
// DELETE /reviews/:reviewId         — Auth (buyer)
// Xóa review + reset reviewed flag trong Order
// ✅ Sau khi xóa → recalcItemRating
// =============================================
exports.deleteReview = async (req, res) => {
  try {
    const userId       = req.user.id;
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, msg: "Review not found" });

    if (review.user.toString() !== userId) {
      return res.status(403).json({ success: false, msg: "You can only delete your own reviews" });
    }

    const itemId = review.item; // lưu lại trước khi xóa

    // Reset reviewed flag → buyer có thể review lại
    await Order.updateOne(
      { _id: review.order, "items.item": itemId },
      { $set: { "items.$.reviewed": false } }
    );

    await review.deleteOne();

    // ✅ Cập nhật rating.average + rating.count của item
    await recalcItemRating(itemId);

    res.json({ success: true, msg: "Review deleted successfully" });
  } catch (err) {
    console.error("deleteReview error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// =============================================
// POST /reviews/:reviewId/reply     — Auth (seller)
// Seller reply hoặc cập nhật reply
// =============================================
exports.replyToReview = async (req, res) => {
  try {
    const sellerId     = req.user.id;
    const { reviewId } = req.params;
    const { content }  = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, msg: "Reply content is required" });
    }
    if (content.trim().length > 500) {
      return res.status(400).json({ success: false, msg: "Reply cannot exceed 500 characters" });
    }

    const review = await Review.findById(reviewId).populate("item", "seller");
    if (!review) return res.status(404).json({ success: false, msg: "Review not found" });

    if (review.item.seller.toString() !== sellerId) {
      return res.status(403).json({ success: false, msg: "Only the seller of this item can reply" });
    }

    review.sellerReply = {
      content:   content.trim(),
      repliedAt: review.sellerReply?.repliedAt || new Date() // giữ nguyên ngày reply đầu tiên
    };

    await review.save();

    res.json({
      success:     true,
      msg:         "Reply submitted successfully",
      sellerReply: review.sellerReply
    });
  } catch (err) {
    console.error("replyToReview error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// =============================================
// DELETE /reviews/:reviewId/reply   — Auth (seller)
// =============================================
exports.deleteReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const sellerId     = req.user.id;

    const review = await Review.findById(reviewId).populate("item", "seller");
    if (!review) return res.status(404).json({ success: false, msg: "Review not found" });

    if (review.item.seller.toString() !== sellerId) {
      return res.status(403).json({ success: false, msg: "Not authorized" });
    }

    if (!review.sellerReply?.repliedAt) {
      return res.status(400).json({ success: false, msg: "No reply to delete" });
    }

    review.sellerReply = undefined;
    await review.save();

    res.json({ success: true, msg: "Reply deleted" });
  } catch (err) {
    console.error("deleteReply error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
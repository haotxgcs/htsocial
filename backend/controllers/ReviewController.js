const Review = require("../models/ReviewModel");
const Order = require("../models/OrderModel");

// =============================================
// GET /reviews/item/:itemId
// Public — lấy tất cả review của 1 item
// =============================================
exports.getReviewsByItem = async (req, res) => {
  const { itemId } = req.params;

  const reviews = await Review.find({ item: itemId })
    .populate("user", "firstname lastname avatar")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    total: reviews.length,
    reviews
  });
};

// =============================================
// POST /reviews/:reviewId/reply  (auth — seller only)
// Seller reply 1 lần duy nhất, không sửa được
// =============================================
exports.replyToReview = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { reviewId } = req.params;
    const { content } = req.body;

    // 1. Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        msg: "Reply content is required"
      });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({
        success: false,
        msg: "Reply cannot exceed 500 characters"
      });
    }

    // 2. Load review + populate item để verify seller
    const review = await Review.findById(reviewId).populate("item", "seller");

    if (!review) {
      return res.status(404).json({
        success: false,
        msg: "Review not found"
      });
    }

    // 3. Chỉ seller của item đó mới được reply
    if (review.item.seller.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        msg: "Only the seller of this item can reply"
      });
    }

    // 4. Chỉ reply 1 lần — không cho sửa
    if (review.sellerReply && review.sellerReply.repliedAt) {
      return res.status(400).json({
        success: false,
        msg: "You have already replied to this review"
      });
    }

    // 5. Save reply
    review.sellerReply = {
      content: content.trim(),
      repliedAt: new Date()
    };

    await review.save();

    res.json({
      success: true,
      msg: "Reply submitted successfully",
      sellerReply: review.sellerReply
    });

  } catch (err) {
    console.error("replyToReview error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};
// Kiểm tra user hiện tại có được phép review item này không:
//   - Đã có completed order chứa item này
//   - Item đó chưa được reviewed trong order đó
// =============================================
exports.canReviewItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    // Tìm completed order của user chứa item này và chưa review
    const order = await Order.findOne({
      user: userId,
      status: "completed",
      "items.item": itemId,
      "items.reviewed": { $ne: true }   // còn ít nhất 1 item chưa reviewed
    }).select("_id items");

    if (!order) {
      return res.json({ canReview: false, orderId: null });
    }

    // Kiểm tra chính xác item trong order đó chưa reviewed
    const orderItem = order.items.find(
      i => i.item.toString() === itemId && !i.reviewed
    );

    if (!orderItem) {
      return res.json({ canReview: false, orderId: null });
    }

    // Kiểm tra thêm trong Review collection (double-check)
    const alreadyReviewed = await Review.findOne({
      user: userId,
      item: itemId,
      order: order._id
    });

    if (alreadyReviewed) {
      return res.json({ canReview: false, orderId: null });
    }

    res.json({ canReview: true, orderId: order._id });

  } catch (err) {
    console.error("canReviewItem error:", err);
    res.status(500).json({ canReview: false, orderId: null });
  }
};

exports.getReviewsBySeller = async (req, res) => {
  const sellerId = req.params.sellerId;
  
  const reviews = await Review.find({ seller: sellerId })
    .populate("user", "firstname lastname avatar")
    .populate("item", "name title images price rating numReviews")
    .sort({ createdAt: -1 });
    
  res.json({
    success: true,
    total: reviews.length,
    reviews
  });
};


const Review = require("../models/ReviewModel");

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

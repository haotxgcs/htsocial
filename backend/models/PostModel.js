const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Tên món
    category: { type: String, required: true }, // Danh mục
    ingredients: { type: String }, // Nguyên liệu (hoặc Array nếu muốn xịn hơn)
    instructions: { type: String }, // Cách làm
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User",required: true },
    media: { type: String },
    mediaType: { type: String, enum: ['image', 'video'], default: null },
    likes: [{type: mongoose.Schema.Types.ObjectId,ref: "User"}],

    commentCount: { type: Number, default: 0 },
    replyCommentCount: {type: Number,default: 0},
    sharesCount: { type: Number, default: 0 },
    savesCount: { type: Number, default: 0 },
    totalRatings: { type: Number,default: 0},
    totalRatingSum: { type: Number, default: 0 },
    averageRating: {type: Number,default: 0},

    audience: { type: String, enum: ["public", "friends", "private"], default: "public"},
    hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);

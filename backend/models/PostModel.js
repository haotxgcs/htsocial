const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User",required: true },
    media: { type: String },
    mediaType: { type: String, enum: ['image', 'video'], default: null },
    likes: [{type: mongoose.Schema.Types.ObjectId,ref: "User"}],
    commentCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    audience: { type: String, enum: ["public", "friends", "onlyme"], default: "public"}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);

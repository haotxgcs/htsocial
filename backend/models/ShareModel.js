// models/ShareModel.js
const mongoose = require("mongoose");

const shareSchema = new mongoose.Schema(
  {
    username: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    content: { type: String }, // người dùng có thể viết gì đó khi share
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Share", shareSchema);

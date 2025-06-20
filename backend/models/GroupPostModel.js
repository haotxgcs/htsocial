// models/GroupPostModel.js
const mongoose = require('mongoose');

const groupPostSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    media: { type: String },
    mediaType: { type: String, enum: ["image", "video"] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    approved: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("GroupPost", groupPostSchema);

// models/GroupModel.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pendingMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    approvedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "GroupPost" }],
    pendingPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "GroupPost" }],
    postCount: { type: Number, default: 0 },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Group", groupSchema);

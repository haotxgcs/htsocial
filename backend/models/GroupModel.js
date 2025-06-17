// ✅ GroupModel.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  avatar: { type: String, default: 'uploads/group.png' }, // URL to group avatar image

  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  posts: [
    {
      content: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
      approved: { type: Boolean, default: true } // Với nhóm private thì sẽ set false chờ duyệt
    }
  ],
  pendingPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }] // ✅ mới thêm

}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
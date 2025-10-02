const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  image: { type: String }, // (Tuỳ chọn)
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ✅ Like comment
  
  replies: [
    {
      content: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User",default: [] }], // ✅ Like reply
      replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
      replyToReplyId: { type: mongoose.Schema.Types.ObjectId},
      createdAt: { type: Date, default: Date.now }
      
    }
  ],
  rating: { type: Number, min: 1, max: 5, default: null },

}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);

const Comment = require("../models/CommentModel");
const Post = require("../models/PostModel");
const User = require("../models/UserModel");


// ===== Tạo comment mới =====
exports.createComment = async (req, res) => {
  try {
    const { content, authorId } = req.body;
    const postId = req.params.postId || req.body.post;

    if (!content || !authorId || !postId) {
      return res.status(400).json({ msg: "Missing content, authorId, or post ID" });
    }

    const user = await User.findById(authorId);
    if (!user) return res.status(404).json({ msg: "Author not found" });

    const comment = new Comment({
      content,
      author: user._id,
      post: postId,
      likes: [],
    });

    await comment.save();
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    const populated = await Comment.findById(comment._id)
      .populate("author", "username firstname lastname avatar");

    res.status(201).json({ msg: "Comment added", comment: populated });
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ===== Lấy danh sách comment theo postId =====
exports.getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.postId;

    const comments = await Comment.find({ post: postId })
      .populate("author", "username firstname lastname avatar")
      .populate("replies.author", "username firstname lastname avatar")
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ msg: "Error fetching comments" });
  }
};

// ===== Cập nhật comment =====
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    if (content) comment.content = content;

    await comment.save();

    const updated = await Comment.findById(comment._id)
      .populate("author", "username firstname lastname avatar");
      

    res.status(200).json({ msg: "Comment updated", comment: updated });
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ msg: "Error updating comment" });
  }
};

// ===== Xoá comment =====
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.json({ msg: "Comment deleted" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ msg: "Error deleting comment" });
  }
};

exports.toggleLikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    const { userId } = req.body;

    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const index = comment.likes.indexOf(userId);
    if (index > -1) {
      comment.likes.splice(index, 1);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

    // ✅ Populate lại để không mất thông tin author
    const updatedComment = await Comment.findById(comment._id)
      .populate("author", "username firstname lastname avatar")
      .populate("replies.author", "username firstname lastname avatar");

    res.status(200).json({
      msg: index > -1 ? "Comment unliked" : "Comment liked",
      comment: updatedComment
    });
  } catch (err) {
    console.error("Toggle like comment error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== Trả lời comment (reply) =====
exports.addReply = async (req, res) => {
  try {
    const { content, authorId } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const user = await User.findById(authorId);
    if (!user) return res.status(404).json({ msg: "Author not found" });

    comment.replies.push({
      content,
      author: user._id,
      createdAt: new Date(),
      likes: []
    });

    await comment.save();

    const updated = await Comment.findById(comment._id)
      .populate("author", "username firstname lastname avatar")
      .populate("replies.author", "username firstname lastname avatar ");
      

    res.status(200).json({ msg: "Reply added", reply: updated.replies.at(-1) });

  } catch (err) {
    console.error("Reply error:", err);
    res.status(500).json({ msg: "Error adding reply" });
  }
};

exports.updateReply = async (req, res) => {
  try {
    const { content } = req.body;
    const { commentId, replyId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });
    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ msg: "Reply not found" });
    if (content) reply.content = content;
    await comment.save();
    const updated = await Comment.findById(comment._id)
      .populate("author", "username firstname lastname avatar")
      .populate("replies.author", "username firstname lastname avatar");
    res.status(200).json({ msg: "Reply updated", replies: updated.replies });
  } catch (err) { 
    console.error("Update reply error:", err);
    res.status(500).json({ msg: "Server error" });
  }
}

exports.deleteReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });
    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ msg: "Reply not found" });
    comment.replies.pull(replyId);
    await comment.save(); 
    res.status(200).json({ msg: "Reply deleted", replies: comment.replies });
  } catch (err) {
    console.error("Delete reply error:", err);
    res.status(500).json({ msg: "Server error" });
  }
}


exports.toggleLikeReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const { userId } = req.body;

    const comment = await Comment.findById(commentId).populate("replies.author", "firstname lastname avatar username");
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ msg: "Reply not found" });

    const index = reply.likes.indexOf(userId);
    if (index > -1) {
      reply.likes.splice(index, 1);
    } else {
      reply.likes.push(userId);
    }

    await comment.save();

    // Re-populate lại để lấy đầy đủ thông tin tác giả
    const updated = await Comment.findById(commentId).populate("replies.author", "firstname lastname avatar username");

    const updatedReply = updated.replies.id(replyId);

    res.status(200).json({
      msg: index > -1 ? "Reply unliked" : "Reply liked",
      reply: updatedReply // 👍 Trả về reply đầy đủ author
    });

  } catch (err) {
    console.error("Toggle like reply error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};




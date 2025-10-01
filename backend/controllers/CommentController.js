const Comment = require("../models/CommentModel");
const Post = require("../models/PostModel");
const User = require("../models/UserModel");

// Tạo comment mới
exports.createComment = async (req, res) => {
  try {
    const { content, authorId } = req.body;
    const postId = req.params.postId;

    if (!content || !authorId || !postId) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const user = await User.findById(authorId);
    if (!user) return res.status(404).json({ msg: "Author not found" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    // Tạo comment
    const comment = new Comment({
      content,
      author: user._id,
      post: postId,
      likes: [],
    });

    await comment.save();

    // Tăng commentCount
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    const populated = await Comment.findById(comment._id)
      .populate("author", "username firstname lastname avatar");

    res.status(201).json({ msg: "Comment added", comment: populated });
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Lấy comments theo Post
exports.getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.postId;

    const comments = await Comment.find({ post: postId })
      .populate("author", "username firstname lastname avatar")
      .populate("replies.author", "username firstname lastname avatar")
      .populate("replies.replyTo", "username firstname lastname avatar")
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ msg: "Error fetching comments" });
  }
};

// Cập nhật comment
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Content is required" });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    comment.content = content;
    await comment.save();

    const updated = await Comment.findById(comment._id)
      .populate("author", "username firstname lastname avatar");

    res.status(200).json({ msg: "Comment updated", comment: updated });
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ msg: "Error updating comment" });
  }
};

// Xóa comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const numReplies = comment.replies?.length || 0;

    // Giảm counter
    await Post.findByIdAndUpdate(comment.post, {
      $inc: {
        commentCount: -1,
        replyCommentCount: -numReplies
      }
    });

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ msg: "Comment deleted" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ msg: "Error deleting comment" });
  }
};

// Toggle like comment
exports.toggleLikeComment = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const index = comment.likes.indexOf(userId);
    if (index > -1) {
      comment.likes.splice(index, 1);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();

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

// Add Reply
exports.addReply = async (req, res) => {
  try {
    const { content, authorId, replyToUserId } = req.body;
    const { commentId } = req.params;

    if (!content || !authorId) {
      return res.status(400).json({ msg: "Content and authorId are required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const user = await User.findById(authorId);
    if (!user) return res.status(404).json({ msg: "Author not found" });

    comment.replies.push({
      content,
      author: user._id,
      replyTo: replyToUserId || null,
      createdAt: new Date(),
      likes: []
    });

    await comment.save();

    // Tăng replyCommentCount
    await Post.findByIdAndUpdate(comment.post, { $inc: { replyCommentCount: 1 } });

    const updated = await Comment.findById(comment._id)
      .populate("replies.author", "firstname lastname avatar")
      .populate("replies.replyTo", "firstname lastname avatar");

    res.status(200).json({ msg: "Reply added", reply: updated.replies.at(-1) });
  } catch (err) {
    console.error("Reply error:", err);
    res.status(500).json({ msg: "Error adding reply" });
  }
};

// Update Reply
exports.updateReply = async (req, res) => {
  try {
    const { content } = req.body;
    const { commentId, replyId } = req.params;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: "Content is required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ msg: "Reply not found" });

    reply.content = content;
    await comment.save();

    const updated = await Comment.findById(commentId)
      .populate("replies.author", "firstname lastname avatar")
      .populate("replies.replyTo", "firstname lastname avatar");

    const updatedReply = updated.replies.id(replyId);

    res.status(200).json({ msg: "Reply updated", reply: updatedReply });
  } catch (err) {
    console.error("Update reply error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete Reply
exports.deleteReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ msg: "Reply not found" });

    comment.replies.pull(replyId);
    await comment.save();

    // Giảm replyCommentCount
    await Post.findByIdAndUpdate(comment.post, { $inc: { replyCommentCount: -1 } });

    res.status(200).json({ msg: "Reply deleted", replies: comment.replies });
  } catch (err) {
    console.error("Delete reply error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Toggle like reply
exports.toggleLikeReply = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    const comment = await Comment.findById(commentId);
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

    const updated = await Comment.findById(commentId)
      .populate("replies.author", "firstname lastname avatar")
      .populate("replies.replyTo", "firstname lastname avatar");

    const updatedReply = updated.replies.id(replyId);

    res.status(200).json({
      msg: index > -1 ? "Reply unliked" : "Reply liked",
      reply: updatedReply
    });
  } catch (err) {
    console.error("Toggle like reply error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
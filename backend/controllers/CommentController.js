const Comment = require("../models/CommentModel");
const Post = require("../models/PostModel");
const User = require("../models/UserModel");

// Tạo comment mới
exports.createComment = async (req, res) => {
  try {
    const { content, author } = req.body;
    const postId = req.params.postId || req.body.post; // Cho phép lấy từ params hoặc body

    if (!content || !author || !postId) {
      return res.status(400).json({ msg: "Missing content, author, or post ID" });
    }

    const user = await User.findOne({ username: author });
    if (!user) return res.status(404).json({ msg: "Author not found" });

    const comment = new Comment({
      content,
      author: user._id,
      post: postId
    });

    await comment.save();
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    const populated = await Comment.findById(comment._id)
      .populate("author", "username firstname lastname");

    res.status(201).json({ msg: "Comment added", comment: populated });
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Lấy danh sách comment theo postId
exports.getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.postId;

    const comments = await Comment.find({ post: postId })
      .populate("author", "username firstname lastname")
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ msg: "Error fetching comments" });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    if (content) comment.content = content;

    await comment.save();

    const updated = await Comment.findById(comment._id)
      .populate("author", "username firstname lastname");

    res.status(200).json({ msg: "Comment updated", comment: updated });
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ msg: "Error updating comment" });
  }
};

// Xoá comment
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

// Toggle like comment
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
    res.status(200).json({
      msg: index > -1 ? "Comment unliked" : "Comment liked",
      likesCount: comment.likes.length
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// Trả lời comment
exports.addReply = async (req, res) => {
  try {
    const { content, author } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const user = await User.findOne({ username: author });
    if (!user) return res.status(404).json({ msg: "Author not found" });

    comment.replies.push({
      content,
      author: user._id,
      createdAt: new Date()
    });

    await comment.save();

    res.status(200).json({ msg: "Reply added", replies: comment.replies });
  } catch (err) {
    console.error("Reply error:", err);
    res.status(500).json({ msg: "Error adding reply" });
  }
};

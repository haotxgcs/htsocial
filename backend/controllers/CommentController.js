const Comment = require("../models/CommentModel");
const Post = require("../models/PostModel");
const User = require("../models/UserModel");

// Tạo comment mới (dùng username thay vì userId)
exports.createComment = async (req, res) => {
  try {
    const { post, author, content } = req.body;

    // Tìm user theo username
    const user = await User.findOne({ username: author });
    if (!user) return res.status(404).json({ msg: "Author not found" });

    // Tạo comment
    const comment = new Comment({
      content,
      author: user._id,
      post
    });

    await comment.save();

    // Tăng commentCount cho bài post
    await Post.findByIdAndUpdate(post, { $inc: { commentCount: 1 } });

    // Populate lại để trả dữ liệu
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
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ msg: "Error fetching comments" });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const image = req.file ? req.file.path : null;

    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    // Cập nhật nội dung mới
    if (content) comment.content = content;
    if (image) comment.image = image;

    await comment.save();

    const updated = await Comment.findById(comment._id)
      .populate("author", "username firstname lastname");

    res.status(200).json({ msg: "Comment updated", comment: updated });
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ msg: "Error updating comment" });
  }
};


// Xoá comment theo commentId
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    // Giảm commentCount cho bài viết
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.json({ msg: "Comment deleted" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ msg: "Error deleting comment" });
  }
};

// ✅ Like/Unlike comment (toggle)
exports.toggleLikeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    const { userId } = req.body;

    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    const index = comment.likes.indexOf(userId);
    if (index > -1) {
      comment.likes.splice(index, 1); // Unlike
    } else {
      comment.likes.push(userId); // Like
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

exports.addReply = async (req, res) => {
  try {
    const { content, author } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    if (!content || !author) {
      return res.status(400).json({ msg: "Missing content or author" });
    }

    // ✅ Tìm user theo username
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

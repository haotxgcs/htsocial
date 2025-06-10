const express = require("express");
const router = express.Router();
const {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  toggleLikeComment,
  addReply
} = require("../controllers/CommentController");

// Tạo comment cho 1 bài viết
router.post("/posts/:postId", createComment);

// Lấy toàn bộ comment theo bài viết
router.get("/posts/:postId", getCommentsByPost);

// Update / Delete / Like / Reply comment
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);
router.post("/like/:commentId", toggleLikeComment);
router.post("/reply/:commentId", addReply);


module.exports = router;

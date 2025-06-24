const express = require("express");
const router = express.Router();
const {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  toggleLikeComment,
  addReply,
  updateReply,
  deleteReply,
  toggleLikeReply
} = require("../controllers/CommentController");

// Tạo comment cho 1 bài viết
router.post("/posts/:postId", createComment);

// Lấy toàn bộ comment theo bài viết
router.get("/posts/:postId", getCommentsByPost);

// Update, delete, like comment
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);
router.post("/like/:commentId", toggleLikeComment);

// Reply, update, delete, like reply
router.post("/reply/:commentId", addReply);
router.put("/reply/:commentId/:replyId", updateReply);
router.delete("/reply/:commentId/:replyId", deleteReply);
router.post("/reply/:commentId/:replyId/like", toggleLikeReply);


module.exports = router;

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

router.post("/", createComment);
router.get("/posts/:postId", getCommentsByPost);
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);

router.post("/like/:commentId", toggleLikeComment);
router.post("/reply/:commentId", addReply);

module.exports = router;

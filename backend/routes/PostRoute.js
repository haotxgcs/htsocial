const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike, 
} = require("../controllers/PostController");

router.post("/", upload.single("image") , createPost);
router.get("/", getAllPosts);
router.get("/:id", getPostById);
router.put("/:id",upload.single("file"), updatePost);
router.delete("/:id", deletePost);

router.post("/:id/like", toggleLike); // ← POST vì thay đổi trạng thái

module.exports = router;

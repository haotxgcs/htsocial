const express = require("express");
const router = express.Router();
const { uploadPostMedia } = require("../middleware/uploadCloudinary");

const {
  createPost,
  getAllPosts,
  getPostById,
  getPostsByUser,
  updatePost,
  deletePost,
  toggleLike, 
  getVisiblePosts,
  hidePost,
  unhidePost,
  getHiddenPosts,
  getPostSavesCount
  
} = require("../controllers/PostController");

router.post("/", uploadPostMedia.single("image"), createPost);
router.get("/", getAllPosts);
router.get('/visible/:viewerId', getVisiblePosts);

router.get("/:id", getPostById);
router.get("/:id/saves-count", getPostSavesCount); 
router.get("/user/:userId", getPostsByUser);
router.put("/:id", uploadPostMedia.single("image"), updatePost);
router.delete("/:id", deletePost);

router.post("/hide-post/:postId", hidePost);
router.post("/unhide-post/:postId", unhidePost);
router.get("/hide-post/user/:userId", getHiddenPosts);


router.post("/:id/like", toggleLike); 





module.exports = router;
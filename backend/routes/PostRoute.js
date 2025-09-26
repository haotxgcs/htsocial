const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

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
  toggleSavePost,
  getSavedPostIds,
  getSavedPosts
} = require("../controllers/PostController");

router.post("/", upload.single("image") , createPost);
router.get("/", getAllPosts);
router.get('/visible/:viewerId', getVisiblePosts);
// Get full saved posts để hiển thị trang saved
router.get('/saved-posts/:userId', getSavedPosts);
router.get("/:id", getPostById);
router.get("/user/:userId", getPostsByUser);
router.put("/:id",upload.single("image"), updatePost);
router.delete("/:id", deletePost);

router.post("/hide-post/:postId", hidePost);
router.post("/unhide-post/:postId", unhidePost);
router.get("/hide-post/user/:userId", getHiddenPosts);


router.post("/:id/like", toggleLike); 

// Thêm vào routes/postRoutes.js hoặc file route chính

// Save/Unsave post
router.post('/:postId/save', toggleSavePost);

// Get saved post IDs của user (để check trên frontend)
router.get('/users/:userId/saved-posts', getSavedPostIds);



module.exports = router;

const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const multer = require("multer");

// Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Auth
router.post("/register", AuthController.register);
router.get("/verify/:id", AuthController.verifyByLink);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// User info
router.get("/", AuthController.getAllUsers);
router.get("/:id", AuthController.getUserById);
router.put("/:id", AuthController.updateUser);
router.delete("/:id", AuthController.deleteUser);

// Cập nhật ảnh bìa và bio
router.put("/profile/:id", upload.single("coverPhoto"), AuthController.updateProfile);

// Kết bạn
router.post("/friend-request/send", AuthController.sendFriendRequest);
router.post("/friend-request/accept", AuthController.acceptFriendRequest);
router.post("/friend-request/cancel", AuthController.cancelFriendRequest);
router.post("/unfriend", AuthController.unFriend);

// Online status
router.post("/active-status", AuthController.setActiveStatus);

// Get friends
router.get("/:userId/friends", AuthController.getFriends);

// View hidden posts
router.post('/:userId/hide-post/:postId', AuthController.hidePost);


module.exports = router;

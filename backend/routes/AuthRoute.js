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
router.get('/users/:id/is-friend/:viewerId', AuthController.checkFriendStatus);


// Online status
router.post("/active-status", AuthController.setActiveStatus);

// Get friends
router.get("/:userId/friends", AuthController.getFriends);

// View hidden posts
router.post('/:userId/hide-post/:postId', AuthController.hidePost);

// Đổi Email
router.post("/change-email/request", AuthController.requestEmailChange);
router.post("/change-email/verify", AuthController.verifyAndChangeEmail);

// Đổi Mật khẩu
router.post("/change-password/request", AuthController.requestPasswordChange);
router.post("/change-password/verify", AuthController.verifyAndChangePassword);

// 1. Upload Avatar
router.post('/:id/avatar', upload.single('avatar'), AuthController.uploadAvatar);

// 2. Upload Cover Photo
router.post('/:id/cover', upload.single('coverPhoto'), AuthController.uploadCover);

// GET: Lấy danh sách lịch sử
// URL: /users/:id/search-history
router.get("/:id/search-history", AuthController.getSearchHistory);

// POST: Lưu từ khóa mới
// URL: /users/:id/search-history
router.post("/:id/search-history", AuthController.saveSearchHistory);

// DELETE: Xóa 1 item (gửi body { query: "..." })
// URL: /users/:id/search-history
router.delete("/:id/search-history", AuthController.removeSearchHistoryItem);

// DELETE: Xóa tất cả
// URL: /users/:id/search-history/all
router.delete("/:id/search-history/all", AuthController.clearSearchHistory);




module.exports = router;

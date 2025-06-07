const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");

// Đăng ký / Xác minh / Login
router.post("/register", AuthController.register);
router.get("/verify/:id", AuthController.verifyByLink);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// Lấy danh sách user, user theo ID
router.get("/", AuthController.getAllUsers);
router.get("/:id", AuthController.getUserById);

// Cập nhật / Xóa User
router.put("/:id", AuthController.updateUser);
router.delete("/:id", AuthController.deleteUser);

// Kết bạn
router.post("/friend-request/send", AuthController.sendFriendRequest);
router.post("/friend-request/accept", AuthController.acceptFriendRequest);
router.post("/friend-request/cancel", AuthController.cancelFriendRequest);
router.post("/unfriend", AuthController.unFriend);

// Cập nhật trạng thái hoạt động
router.post("/active-status", AuthController.setActiveStatus);

module.exports = router;

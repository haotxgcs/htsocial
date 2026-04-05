const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const C       = require("../controllers/NotificationController");

// Get all notifications (paginated)
router.get("/",                auth, C.getNotifications);

// Unread count badge
router.get("/unread-count",    auth, C.getUnreadCount);

// Mark all as read
router.patch("/read-all",      auth, C.markAllRead);

// Mark one as read
router.patch("/:id/read",      auth, C.markOneRead);

// Xóa tất cả
router.delete("/",      auth, C.deleteAll);

// Xóa 1
router.delete("/:id",   auth, C.deleteOne);

module.exports = router;
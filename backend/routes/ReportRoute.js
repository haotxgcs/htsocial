const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const { requireAdmin } = require("../controllers/AdminController");
const C = require("../controllers/ReportController");

// User routes
router.post("/",     auth, C.createReport);   // Tạo report
router.get("/my",    auth, C.getMyReports);   // Xem report của mình

// Admin routes
router.get("/",          auth, requireAdmin, C.getReports);          // Lấy tất cả reports
router.patch("/:id/status", auth, requireAdmin, C.updateStatus);     // Cập nhật status
router.delete("/:id",    auth, requireAdmin, C.deleteReport);        // Xóa report

module.exports = router;
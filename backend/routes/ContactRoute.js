const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const { requireAdmin } = require("../controllers/AdminController");
const C = require("../controllers/ContactController");

router.post("/",           C.createContact);                    // Public — không cần auth
router.get("/",            auth, requireAdmin, C.getContacts);  // Admin
router.patch("/:id/reply", auth, requireAdmin, C.replyContact); // Admin
router.patch("/:id/read",  auth, requireAdmin, C.markRead);     // Admin
router.delete("/:id",      auth, requireAdmin, C.deleteContact);// Admin

module.exports = router;
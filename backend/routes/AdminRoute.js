const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const A       = require("../controllers/AdminController");

// Tất cả routes đều cần auth + admin
router.use(auth, A.requireAdmin);

// Dashboard
router.get("/stats", A.getStats);

// Users
router.get("/users",            A.getUsers);
router.patch("/users/:id/ban",  A.banUser);
router.patch("/users/:id/unban",A.unbanUser);

// Posts
router.get("/posts",        A.getPosts);
router.delete("/posts/:id", A.deletePost);

// Shares
router.get("/shares",        A.getShares);
router.delete("/shares/:id", A.deleteShare);

// Marketplace items
router.get("/items",        A.getItems);
router.delete("/items/:id", A.deleteItem);

module.exports = router;
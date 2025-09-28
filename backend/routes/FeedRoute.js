// routes/FeedRoute.js
const express = require("express");
const router = express.Router();
const { 
  getUnifiedFeed,
  getUserFeed,
  getHiddenShares,
  getHiddenPosts,
  getSavedItems,
  toggleSaveItem,
  getSavedItemIds
} = require("../controllers/FeedController");

// ===== MAIN FEED ROUTES =====
router.get("/:viewerId", getUnifiedFeed);
router.get("/users/:userId", getUserFeed);

// ===== HIDDEN CONTENT ROUTES =====
router.get('/hidden-shares/:viewerId', getHiddenShares);
router.get("/hidden-posts/:viewerId", getHiddenPosts);

// ===== SAVED CONTENT ROUTES =====
// Get full saved items để hiển thị trang saved
router.get('/saved-items/:userId', getSavedItems);

// Save/Unsave item (post hoặc share)
router.post('/save/:itemId', toggleSaveItem);

// Get saved item IDs của user (để check trên frontend)
router.get('/users/:userId/saved-items', getSavedItemIds);

module.exports = router;
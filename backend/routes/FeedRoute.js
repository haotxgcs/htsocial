// ===== FeedRoute.js =====
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

router.get("/:viewerId", getUnifiedFeed);
router.get("/users/:userId", getUserFeed);

router.get('/hidden-shares/:viewerId', getHiddenShares);
router.get("/hidden-posts/:viewerId", getHiddenPosts);

// Saved posts routes (chỉ posts)
router.get('/saved-items/:userId', getSavedItems);
router.post('/save/:itemId', toggleSaveItem);
router.get('/users/:userId/saved-items', getSavedItemIds);

module.exports = router;
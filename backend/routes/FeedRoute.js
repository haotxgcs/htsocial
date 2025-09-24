// routes/FeedRoute.js
const express = require("express");
const router = express.Router();
const { getUnifiedFeed,
        getUserFeed,
        getHiddenShares,
        getHiddenPosts
      } = require("../controllers/FeedController");

router.get("/:viewerId", getUnifiedFeed);
router.get("/users/:userId", getUserFeed);
router.get('/hidden-shares/:viewerId', getHiddenShares);
router.get("/hidden-posts/:viewerId", getHiddenPosts);

module.exports = router;

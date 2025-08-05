// routes/FeedRoute.js
const express = require("express");
const router = express.Router();
const { getUnifiedFeed,
        getHiddenShares,
        getHiddenPosts
      } = require("../controllers/FeedController");

router.get("/:viewerId", getUnifiedFeed);
router.get('/hidden-shares/:viewerId', getHiddenShares);
router.get("/hidden-posts/:viewerId", getHiddenPosts);

module.exports = router;

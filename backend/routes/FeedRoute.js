// routes/FeedRoute.js
const express = require("express");
const router = express.Router();
const { getUnifiedFeed } = require("../controllers/FeedController");

router.get("/:viewerId", getUnifiedFeed);

module.exports = router;

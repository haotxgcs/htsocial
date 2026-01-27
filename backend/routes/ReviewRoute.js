const router = require("express").Router();
const { getReviewsByItem } = require("../controllers/ReviewController");

router.get("/item/:itemId", getReviewsByItem);

module.exports = router;

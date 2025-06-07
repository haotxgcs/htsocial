const express = require("express");
const router = express.Router();
const {
  sharePost,
  getAllShares,
  updateShare,
  deleteShare,
} = require("../controllers/ShareController");

router.post("/:id", sharePost);
router.get("/", getAllShares);
router.put("/:id", updateShare);
router.delete("/:id", deleteShare);

module.exports = router;

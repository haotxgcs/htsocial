const express = require("express");
const router = express.Router();
const {
  sharePost,
  getAllShares,
  updateShare,
  deleteShare,
  hideShare,
  unhideShare

} = require("../controllers/ShareController");

router.post("/:id", sharePost);
router.get("/", getAllShares);
router.put("/:id", updateShare);
router.delete("/:id", deleteShare);

router.post("/hide-share/:id", hideShare);
router.post("/unhide-share/:id", unhideShare);

module.exports = router;

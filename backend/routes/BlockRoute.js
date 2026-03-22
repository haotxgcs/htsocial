const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const C       = require("../controllers/BlockController");

router.post("/",               auth, C.blockUser);
router.post("/unblock",        auth, C.unblockUser);
router.get("/list",            auth, C.getBlockedList);
router.get("/check/:targetId", auth, C.checkBlock);

module.exports = router;
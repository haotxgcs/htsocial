const express = require("express");
const router = express.Router();
const MarketplaceController = require("../controllers/MarketplaceController");
const multer = require("multer");
const auth = require("../middleware/authMiddleware");

// ===== Upload Config =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// ===== Routes =====

// CREATE ITEM (login required)
router.post(
  "/create",
  auth,
  upload.array("images", 5),
  MarketplaceController.createItem
);

// GET ALL ITEMS (login required – để dùng My Items)
router.get(
  "/",
  auth,
  MarketplaceController.getAllItems
);

// GET ITEM DETAIL
router.get(
  "/:id",
  MarketplaceController.getItemById
);

// UPDATE ITEM (chỉ seller)
router.put(
  "/:id",
  auth,
  upload.array("images", 5),
  MarketplaceController.updateItem
);

// DELETE ITEM (chỉ seller)
router.delete(
  "/:id",
  auth,
  MarketplaceController.deleteItem
);

module.exports = router;

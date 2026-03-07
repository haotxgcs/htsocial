const express = require("express");
const router = express.Router();
const MarketplaceController = require("../controllers/MarketplaceController");
const auth = require("../middleware/authMiddleware");

// ✅ Cloudinary Upload Middleware
const uploadCloud = require("../middleware/uploadCloudinary");

/**
 * ============================
 * MARKETPLACE ROUTES
 * ============================
 */

// ✅ CREATE ITEM (Seller Upload Images)
router.post(
  "/create",
  auth,
  uploadCloud.array("images", 5),
  MarketplaceController.createItem
);

// ✅ GET ALL ITEMS
router.get(
  "/",
  auth,
  MarketplaceController.getAllItems
);

// ✅ GET ITEM DETAIL
router.get(
  "/:id",
  MarketplaceController.getItemById
);

// ✅ UPDATE ITEM (Seller Only)
router.put(
  "/:id",
  auth,
  uploadCloud.array("images", 5),
  MarketplaceController.updateItem
);

// ✅ DELETE ITEM (Soft Delete)
router.delete(
  "/:id",
  auth,
  MarketplaceController.deleteItem
);

module.exports = router;

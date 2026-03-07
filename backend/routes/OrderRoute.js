const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    checkout,
    buyNow,
    getMyOrders,
    getOrderById,
    getOrdersForSeller,
    updateOrderStatusBySeller,
    cancelOrderBySeller,
    cancelOrder,
    reviewItem

} = require("../controllers/OrderController");

router.post("/checkout", auth, checkout);
router.post("/buy-now/:itemId", auth, buyNow);

router.get("/", auth, getMyOrders);
router.get("/seller", auth, getOrdersForSeller);
router.get("/:id", auth, getOrderById);

router.patch("/:id/seller-status", auth, updateOrderStatusBySeller);
router.patch("/:id/seller-cancel", auth, cancelOrderBySeller);
router.put("/:id/cancel", auth, cancelOrder);
router.post("/review", auth, reviewItem);

module.exports = router;

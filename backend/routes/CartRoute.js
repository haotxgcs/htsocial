const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart

} = require("../controllers/CartController");

router.get("/", auth, getCart);
router.post("/add", auth, addToCart);
router.put("/update", auth, updateCartItem);
router.delete("/:itemId", auth, removeFromCart);

module.exports = router;
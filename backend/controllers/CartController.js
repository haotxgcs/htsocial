const Cart = require("../models/CartModel");
const MarketplaceItem = require("../models/MarketplaceItemModel");

/**
 * GET CART
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: req.user.id })
    .populate({
      path: "items.item",
      populate: {
        path: "seller",
        select: "firstname lastname"
      }
    });

    cart.items = cart.items.filter(i => i.item !== null && i.item.seller !== null);

    res.json({
      success: true,
      cart: cart || { items: [] }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Failed to load cart"
    });
  }
};


/**
 * ADD TO CART
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, quantity = 1 } = req.body;

    // 1. Validate quantity
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        msg: "Quantity must be at least 1"
      });
    }

    // 2. Load item
    const item = await MarketplaceItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        msg: "Item not found"
      });
    }

    // 3. Seller cannot buy own item
    if (item.seller.toString() === userId) {
      return res.status(403).json({
        success: false,
        msg: "You cannot buy your own item"
      });
    }

    // 4. Stock check
    if (item.quantity === 0) {
      return res.status(400).json({
        success: false,
        msg: "Item is out of stock"
      });
    }

    if (quantity > item.quantity) {
      return res.status(400).json({
        success: false,
        msg: `Only ${item.quantity} items left in stock`
      });
    }

    


    // 5. Get cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(
      i => i.item.toString() === itemId
    );

    if (!existingItem && cart.items.length >= 20) {
      return res.status(400).json({
        success: false,
        msg: "Cart item limit reached"
      });
    }

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;

      if (newQty > item.quantity) {
        return res.status(400).json({
          success: false,
          msg: `You already have ${existingItem.quantity} in cart. Max allowed: ${item.quantity}`
        });
      }

      existingItem.quantity = newQty;
    } else {
      cart.items.push({ item: itemId, quantity });
    }

    await cart.save();

    await cart.populate("items.item");

    res.json({
      success: true,
      msg: "Item added to cart",
      cart
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      msg: "Failed to add item to cart"
    });
  }
};

/**
 * UPDATE CART ITEM QUANTITY
 */
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        msg: "Quantity must be at least 1"
      });
    }

    const item = await MarketplaceItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        msg: "Item not found"
      });
    }

    if (item.quantity === 0) {
      return res.status(400).json({
        success: false,
        msg: "Item is out of stock"
      });
    }


    if (quantity > item.quantity) {
      return res.status(400).json({
        success: false,
        msg: `Only ${item.quantity} items available`
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        msg: "Cart not found"
      });
    }

    const cartItem = cart.items.find(
      i => i.item.toString() === itemId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        msg: "Item not in cart"
      });
    }

    cartItem.quantity = quantity;
    await cart.save();

    res.json({
      success: true,
      msg: "Cart updated",
      cart
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: "Failed to update cart"
    });
  }
};

/**
 * REMOVE FROM CART
 */
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        msg: "Cart not found"
      });
    }

    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      i => i.item.toString() !== itemId
    );

    // ❌ Item không tồn tại trong cart
    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        msg: "Item not found in cart"
      });
    }

    await cart.save();
    await cart.populate("items.item");

    res.json({
      success: true,
      msg: "Item removed from cart",
      cart
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      msg: "Failed to remove item"
    });
  }
};


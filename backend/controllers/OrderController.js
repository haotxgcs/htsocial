const Order = require("../models/OrderModel");
const Cart = require("../models/CartModel");
const MarketplaceItem = require("../models/MarketplaceItemModel");
const User = require("../models/UserModel");
const nodemailer = require("nodemailer");

/**
 * =========================
 * MAIL CONFIG (SIMPLE)
 * =========================
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * =========================
 * HELPER: GET DEFAULT ADDRESS
 * =========================
 */
const getDefaultAddress = (user) => {
  return user.addressBook?.find(a => a.isDefault);
};

/**
 * =========================
 * CHECKOUT FROM CART
 * =========================
 */
exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemIds, paymentMethod, note } = req.body;

    if (!paymentMethod || !["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        msg: "Please select a valid payment method"
      });
    }


    // ===== 1. LOAD USER =====
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // ===== 2. GET DEFAULT ADDRESS =====
    const address = getDefaultAddress(user);
    if (!address || !address.fullName || !address.phone || !address.address) {
      return res.status(400).json({
        success: false,
        msg: "Please add a complete delivery address before checkout"
      });
    }

    // ===== 3. LOAD CART =====
    const cart = await Cart.findOne({ user: userId }).populate("items.item");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Your cart is empty"
      });
    }

    // ===== 4. DETERMINE CHECKOUT ITEMS =====
    let checkoutItems = cart.items;

    if (Array.isArray(itemIds) && itemIds.length > 0) {
      const cartItemIds = cart.items.map(ci => ci.item._id.toString());

      const invalidIds = itemIds.filter(id => !cartItemIds.includes(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          msg: "Some selected items are not in your cart"
        });
      }

      checkoutItems = cart.items.filter(ci =>
        itemIds.includes(ci.item._id.toString())
      );
    }


    if (checkoutItems.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "No items selected for checkout"
      });
    }

    let totalPrice = 0;
    const orderItems = [];

    // ===== 5. VALIDATE ITEMS =====
    for (const ci of checkoutItems) {
      const item = ci.item;

      if (!item) {
        return res.status(400).json({
          success: false,
          msg: "One of the items no longer exists"
        });
      }

      if (item.status !== "active") {
        return res.status(409).json({
          success: false,
          msg: `"${item.title}" is not available for purchase`
        });
      }

      if (item.seller.toString() === userId) {
        return res.status(403).json({
          success: false,
          msg: "You cannot purchase your own item"
        });
      }

      if (ci.quantity < 1 || ci.quantity > item.quantity) {
        return res.status(400).json({
          success: false,
          msg: `Invalid quantity for "${item.title}"`
        });
      }

      totalPrice += item.price * ci.quantity;

      orderItems.push({
        item: item._id,
        quantity: ci.quantity,
        price: item.price,
        itemSnapshot: {
          title: item.title,
          images: item.images,
          seller: item.seller
        }
      });
    }

    // ===== 6. CREATE ORDER =====
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalPrice,
      status: "pending",
      note: note?.trim() || "",
      payment: {
        method: paymentMethod,
        status: paymentMethod === "online" ? "paid" : "unpaid"
      },
      paidAt: paymentMethod === "online" ? new Date() : null,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        address: address.address
      }
    });


    // ===== 7. REDUCE STOCK & AUTO SOLD =====
    for (const ci of checkoutItems) {
      const updatedItem = await MarketplaceItem.findByIdAndUpdate(
        ci.item._id,
        { $inc: { quantity: -ci.quantity } },
        { new: true }
      );

      if (updatedItem && updatedItem.quantity === 0 && updatedItem.status !== "hidden") {
        updatedItem.status = "sold";
        await updatedItem.save();
      }
    }

    // ===== 8. REMOVE CHECKED OUT ITEMS FROM CART =====
    cart.items = cart.items.filter(
      ci =>
        !checkoutItems.some(
          coi => coi.item._id.toString() === ci.item._id.toString()
        )
    );
    await cart.save();

    // ===== 9. SEND EMAIL (FAIL SAFE) =====
    const brandColor = "#ff5757";

    const itemsHtml = order.items.map(i => `
      <tr>
        <td style="padding:8px 0;">${i.itemSnapshot.title}</td>
        <td align="center">${i.quantity}</td>
        <td align="right">$${i.price}</td>
      </tr>
    `).join("");

    try {
      await transporter.sendMail({
        from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Order Confirmation - HT Social",
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;">
    <div style="background:${brandColor};padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;">HT Social Marketplace</h1>
    </div>
    <div style="padding:30px;color:#333;">
      <h2>Thank you for your order 🎉</h2>
      <p>Hello <b>${user.firstname} ${user.lastname}</b>,</p>

      <p><b>Order ID:</b> ${order._id}</p>
      <p><b>Status:</b> ${order.status.toUpperCase()}</p>
      <p><b>Payment:</b> ${order.payment.method.toUpperCase()}</p>
      <p><b>Payment status:</b> ${order.payment.status.toUpperCase()}</p>

      ${order.note ? `
      <h3>Order Note</h3>
      <p>${order.note}</p>
      ` : ""}


      <h3>Shipping Address</h3>
      <p>${order.shippingAddress.fullName}<br/>
         ${order.shippingAddress.phone}<br/>
         ${order.shippingAddress.address}</p>

      <h3>Items</h3>
      <table width="100%">${itemsHtml}</table>

      <hr/>
      <p style="font-size:18px;">
        <b>Total:</b>
        <span style="color:${brandColor};font-weight:bold;">
          $${totalPrice}
        </span>
      </p>
    </div>
    <div style="background:#f4f4f4;padding:16px;text-align:center;font-size:12px;color:#888;">
      © ${new Date().getFullYear()} HT Social. All rights reserved.
    </div>
  </div>
</body>
</html>`
      });
    } catch (mailErr) {
      console.error("Order mail failed:", mailErr.message);
    }

    // ===== 10. RESPONSE =====
    res.status(201).json({
      success: true,
      msg: "Order placed successfully",
      orderId: order._id,
      order
    });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to place order"
    });
  }
};



/**
 * =========================
 * BUY NOW (ONE ITEM)
 * =========================
 */
exports.buyNow = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity: rawQty, paymentMethod, note } = req.body;
    const quantity = Math.max(1, Number(rawQty) || 1);

    // ===== 0. VALIDATE PAYMENT =====
    if (!paymentMethod || !["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        msg: "Please select a valid payment method"
      });
    }

    // ===== 1. LOAD USER =====
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // ===== 2. GET DEFAULT ADDRESS =====
    const address = getDefaultAddress(user);
    if (!address || !address.fullName || !address.phone || !address.address) {
      return res.status(400).json({
        success: false,
        msg: "Please add a delivery address before checkout"
      });
    }

    // ===== 3. LOAD ITEM =====
    const item = await MarketplaceItem.findById(itemId);
    if (!item || item.status !== "active") {
      return res.status(409).json({
        success: false,
        msg: "Item not available for purchase"
      });
    }

    // ❌ Cannot buy own item
    if (item.seller.toString() === userId) {
      return res.status(403).json({
        success: false,
        msg: "You cannot buy your own item"
      });
    }

    // ❌ Stock check
    if (quantity > item.quantity) {
      return res.status(400).json({
        success: false,
        msg: `Only ${item.quantity} items left`
      });
    }

    // ===== 4. CREATE ORDER =====
    const totalPrice = item.price * quantity;

    const order = await Order.create({
      user: userId,
      items: [{
        item: item._id,
        quantity,
        price: item.price,
        itemSnapshot: {
          title: item.title,
          images: item.images,
          seller: item.seller
        }
      }],
      totalPrice,
      status: "pending",
      note: note?.trim() || "",
      payment: {
        method: paymentMethod,
        status: paymentMethod === "online" ? "paid" : "unpaid"
      },
      paidAt: paymentMethod === "online" ? new Date() : null,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        address: address.address
      }
    });

    // ===== 5. REDUCE STOCK & AUTO SOLD =====
    item.quantity -= quantity;
    if (item.quantity === 0 && item.status !== "hidden") {
      item.status = "sold";
    }
    await item.save();

    // ===== 6. SEND EMAIL =====
    const brandColor = "#ff5757";

    try {
      await transporter.sendMail({
        from: `"HT Social Marketplace" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Order Confirmation - HT Social",
        html: `
<!DOCTYPE html>
<html>
<body style="background:#f9f9f9;font-family:Arial;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;">
    <div style="background:${brandColor};padding:24px;text-align:center;color:#fff;">
      <h1>HT Social Marketplace</h1>
    </div>
    <div style="padding:30px;">
      <h2>Order Confirmed 🎉</h2>
      <p>Hello <b>${user.firstname} ${user.lastname}</b>,</p>

      <p><b>Order ID:</b> ${order._id}</p>
      <p><b>Status:</b> ${order.status.toUpperCase()}</p>
      <p><b>Payment:</b> ${order.payment.method.toUpperCase()}</p>

      <h3>Item</h3>
      <p>
        <b>${item.title}</b><br/>
        Quantity: ${quantity}<br/>
        Price: $${item.price}
      </p>

      <h3>Shipping Address</h3>
      <p>
        ${order.shippingAddress.fullName}<br/>
        ${order.shippingAddress.phone}<br/>
        ${order.shippingAddress.address}
      </p>

      <hr/>
      <p style="font-size:18px;">
        <b>Total:</b>
        <span style="color:${brandColor};font-weight:bold;">$${totalPrice}</span>
      </p>
    </div>
  </div>
</body>
</html>`
      });
    } catch (err) {
      console.error("BuyNow mail failed:", err.message);
    }

    // ===== 7. RESPONSE =====
    res.status(201).json({
      success: true,
      msg: "Order placed successfully",
      order
    });

  } catch (err) {
    console.error("Buy now error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to place order"
    });
  }
};



/**
 * =========================
 * GET MY ORDERS
 * =========================
 */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to load orders"
    });
  }
};


/**
 * =========================
 * GET ORDERS FOR SELLER
 * =========================
 * Seller sees orders that contain their items
 */
exports.getOrdersForSeller = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const orders = await Order.find({
      "items.itemSnapshot.seller": sellerId
    })
      .populate("user", "firstname lastname email avatar")
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map(order => {
      const sellerItems = order.items.filter(
        i => i.itemSnapshot.seller.toString() === sellerId
      );

      return {
        _id: order._id,
        buyer: order.user,
        status: order.status,
        createdAt: order.createdAt,
        shippingAddress: {
          fullName: order.shippingAddress.fullName,
          phone: order.shippingAddress.phone,
          address: order.shippingAddress.address
        },
        items: sellerItems,
        subtotal: sellerItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0
        )
      };
    });

    res.json({
      success: true,
      orders: formattedOrders
    });
  } catch (err) {
    console.error("Get seller orders error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to load seller orders"
    });
  }
};


// update order status by seller 
exports.updateOrderStatusBySeller = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { status } = req.body;

    const allowedStatuses = ["confirmed", "shipping", "completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status update" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // 🔹 Chỉ update item của seller này
    let updated = false;

    order.items.forEach(item => {
      if (item.itemSnapshot.seller.toString() === sellerId) {
        if (item.sellerStatus === "cancelled") return;
        item.sellerStatus = status;
        updated = true;
      }
    });

    if (!updated) {
      return res.status(403).json({
        msg: "You are not allowed to update this order"
      });
    }

    // 🔹 OPTIONAL: auto update order.status
    const statuses = order.items.map(i => i.sellerStatus);

    if (statuses.every(s => s === "completed")) {
      order.status = "completed";
    } else if (statuses.some(s => s === "shipping")) {
      order.status = "shipping";
    } else if (statuses.every(s => s === "confirmed")) {
      order.status = "confirmed";
    }

    await order.save();

    res.json({
      success: true,
      msg: "Order status updated",
      order
    });

  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// cancel order by seller 
exports.cancelOrderBySeller = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    let cancelledItems = [];

    // 🔹 Cancel ONLY seller's items
    order.items.forEach(item => {
      if (
        item.itemSnapshot.seller.toString() === sellerId &&
        ["pending", "confirmed"].includes(item.sellerStatus)
      ) {
        item.sellerStatus = "cancelled";
        cancelledItems.push(item);
      }
    });

    if (cancelledItems.length === 0) {
      return res.status(403).json({
        msg: "You cannot cancel items in this order"
      });
    }

    // 🔹 Restore stock ONLY for cancelled items
    for (const i of cancelledItems) {
      await MarketplaceItem.findByIdAndUpdate(i.item, {
        $inc: { quantity: i.quantity }
      });
    }

    // 🔹 Save cancel info
    order.cancelledBy = "seller";
    order.cancelReason = reason || "Cancelled by seller";
    order.cancelledAt = new Date();

    // 🔹 Auto update order.status
    const statuses = order.items.map(i => i.sellerStatus);

    if (statuses.every(s => s === "cancelled")) {
      order.status = "cancelled";
    } else if (statuses.every(s => s === "completed")) {
      order.status = "completed";
    } else if (statuses.some(s => s === "shipping")) {
      order.status = "shipping";
    } else if (statuses.some(s => s === "confirmed")) {
      order.status = "confirmed";
    }

    await order.save();

    res.json({
      success: true,
      msg: "Seller items cancelled successfully",
      order
    });

  } catch (err) {
    console.error("Cancel order by seller error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};



/**
 * =========================
 * CANCEL ORDER BY BUYER
 * =========================
 */
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    // ❌ Not owner
    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "Not allowed"
      });
    }

    let cancelledItems = [];

    // 🔹 Buyer can cancel ONLY pending seller items
    order.items.forEach(item => {
      if (item.sellerStatus === "pending") {
        item.sellerStatus = "cancelled";
        cancelledItems.push(item);
      }
    });

    if (cancelledItems.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "This order can no longer be cancelled"
      });
    }

    // 🔹 Restore stock
    for (const i of cancelledItems) {
      await MarketplaceItem.findByIdAndUpdate(i.item, {
        $inc: { quantity: i.quantity }
      });
    }

    // 🔹 Save cancel info
    order.cancelledBy = "buyer";
    order.cancelReason = reason || "Cancelled by buyer";
    order.cancelledAt = new Date();

    // 🔹 Auto update order.status
    const statuses = order.items.map(i => i.sellerStatus);

    if (statuses.every(s => s === "cancelled")) {
      order.status = "cancelled";
    } else if (statuses.some(s => s === "shipping")) {
      order.status = "shipping";
    } else if (statuses.some(s => s === "confirmed")) {
      order.status = "confirmed";
    }

    await order.save();

    res.json({
      success: true,
      msg: "Order cancelled successfully",
      order
    });

  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};


/**
 * =========================
 * REVIEW ORDER
 * =========================
 */
exports.reviewOrderItem = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { orderId, itemId } = req.params;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        msg: "Rating must be between 1 and 5"
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    // ❌ Không phải buyer
    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "Not allowed"
      });
    }

    // ❌ Chỉ review khi đã hoàn thành
    if (order.status !== "completed") {
      return res.status(400).json({
        success: false,
        msg: "Only completed orders can be reviewed"
      });
    }

    // 🔎 Tìm item trong order
    const orderItem = order.items.find(
      i => i.item.toString() === itemId
    );

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        msg: "Item not found in this order"
      });
    }

    // ❌ Không review 2 lần
    if (orderItem.review?.rating) {
      return res.status(400).json({
        success: false,
        msg: "Item already reviewed"
      });
    }

    // ✅ Lưu review
    orderItem.review = {
      rating,
      comment: comment || "",
      reviewedAt: new Date()
    };

    await order.save();

    res.json({
      success: true,
      msg: "Item reviewed successfully"
    });

  } catch (err) {
    console.error("Review item error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};


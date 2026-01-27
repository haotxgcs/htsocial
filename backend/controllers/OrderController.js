const Order = require("../models/OrderModel");
const Cart = require("../models/CartModel");
const MarketplaceItem = require("../models/MarketplaceItemModel");
const User = require("../models/UserModel");
const Review = require("../models/ReviewModel");
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

    // =========================================================
    // ✅ 0. VALIDATE PAYMENT METHOD
    // =========================================================
    if (!paymentMethod || !["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        msg: "Please select a valid payment method (cod or online)"
      });
    }

    // =========================================================
    // ✅ 1. LOAD USER
    // =========================================================
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // =========================================================
    // ✅ 2. GET DEFAULT ADDRESS
    // =========================================================
    const address = getDefaultAddress(user);

    if (!address || !address.fullName || !address.phone || !address.address) {
      return res.status(400).json({
        success: false,
        msg: "Please add a complete delivery address before checkout"
      });
    }

    // =========================================================
    // ✅ 3. LOAD CART
    // =========================================================
    const cart = await Cart.findOne({ user: userId }).populate("items.item");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Your cart is empty"
      });
    }

    // =========================================================
    // ✅ 4. DETERMINE CHECKOUT ITEMS
    // =========================================================
    let checkoutItems = cart.items;

    // ✅ Checkout selected items only
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

    // =========================================================
    // ✅ 5. GROUP ITEMS BY SELLER
    // =========================================================
    const sellerGroups = {};

    for (const ci of checkoutItems) {
      const item = ci.item;

      // ✅ Validate item exists
      if (!item) {
        return res.status(400).json({
          success: false,
          msg: "One of the items no longer exists"
        });
      }

      // ✅ Validate item active
      if (item.status !== "active") {
        return res.status(409).json({
          success: false,
          msg: `"${item.title}" is not available for purchase`
        });
      }

      // ✅ Buyer cannot buy own item
      if (item.seller.toString() === userId) {
        return res.status(403).json({
          success: false,
          msg: "You cannot purchase your own item"
        });
      }

      // ✅ Stock check
      if (ci.quantity < 1 || ci.quantity > item.quantity) {
        return res.status(400).json({
          success: false,
          msg: `Invalid quantity for "${item.title}"`
        });
      }

      // ✅ Group by sellerId
      const sellerId = item.seller.toString();

      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = [];
      }

      sellerGroups[sellerId].push(ci);
    }

    // =========================================================
    // ✅ 6. CREATE ORDERS PER SELLER
    // =========================================================
    const createdOrders = [];

    for (const sellerId in sellerGroups) {
      const sellerItems = sellerGroups[sellerId];

      let totalPrice = 0;
      const orderItems = [];

      // ✅ Build orderItems for this seller
      for (const ci of sellerItems) {
        const item = ci.item;

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

      // =========================================================
      // ✅ CREATE ORDER (1 SELLER = 1 ORDER)
      // =========================================================
      const order = await Order.create({
        user: userId,
        seller: sellerId,

        items: orderItems,
        totalPrice,

        status: "pending",

        note: note?.trim() || "",

        // ✅ IMPORTANT FIX: Do NOT auto paid
        payment: {
          method: paymentMethod,
          status: "unpaid"
        },

        paidAt: null,

        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          address: address.address
        }
      });

      createdOrders.push(order);

      // =========================================================
      // ✅ 7. UPDATE STOCK + SOLD COUNT
      // =========================================================
      for (const ci of sellerItems) {
        const updatedItem = await MarketplaceItem.findByIdAndUpdate(
          ci.item._id,
          {
            $inc: {
              quantity: -ci.quantity,
              soldCount: ci.quantity
            }
          },
          { new: true }
        );

        if (updatedItem.quantity === 0 && updatedItem.status !== "hidden") {
          updatedItem.status = "sold";
          await updatedItem.save();
        }
      }

      // =========================================================
      // ✅ 8. SEND EMAIL CONFIRMATION (FULL TEMPLATE)
      // =========================================================
      const brandColor = "#ff5757";

      const itemsHtml = order.items
        .map(
          i => `
            <tr>
              <td style="padding:8px 0;">${i.itemSnapshot.title}</td>
              <td align="center">${i.quantity}</td>
              <td align="right">$${i.price}</td>
            </tr>
          `
        )
        .join("");

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

      <p><b>Payment Method:</b> ${order.payment.method.toUpperCase()}</p>
      <p><b>Payment Status:</b> ${order.payment.status.toUpperCase()}</p>

      ${
        order.note
          ? `
        <h3>Order Note</h3>
        <p>${order.note}</p>
      `
          : ""
      }

      <h3>Shipping Address</h3>
      <p>
        ${order.shippingAddress.fullName}<br/>
        ${order.shippingAddress.phone}<br/>
        ${order.shippingAddress.address}
      </p>

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
    }

    // =========================================================
    // ✅ 9. REMOVE CHECKED ITEMS FROM CART
    // =========================================================
    cart.items = cart.items.filter(
      ci =>
        !checkoutItems.some(
          coi => coi.item._id.toString() === ci.item._id.toString()
        )
    );

    await cart.save();

    // =========================================================
    // ✅ 10. RESPONSE
    // =========================================================
    res.status(201).json({
      success: true,
      msg: "Checkout successful (Orders created per seller)",
      orders: createdOrders
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

    // =========================================================
    // ✅ 0. VALIDATE PAYMENT
    // =========================================================
    if (!paymentMethod || !["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        msg: "Please select a valid payment method"
      });
    }

    // =========================================================
    // ✅ 1. LOAD USER
    // =========================================================
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found"
      });
    }

    // =========================================================
    // ✅ 2. GET DEFAULT ADDRESS
    // =========================================================
    const address = getDefaultAddress(user);

    if (!address || !address.fullName || !address.phone || !address.address) {
      return res.status(400).json({
        success: false,
        msg: "Please add a delivery address before checkout"
      });
    }

    // =========================================================
    // ✅ 3. LOAD ITEM
    // =========================================================
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

    // =========================================================
    // ✅ 4. CREATE ORDER
    // =========================================================
    const totalPrice = item.price * quantity;

    const order = await Order.create({
      user: userId,

      // ✅ IMPORTANT: Save seller for marketplace logic
      seller: item.seller,

      items: [
        {
          item: item._id,
          quantity,
          price: item.price,
          itemSnapshot: {
            title: item.title,
            images: item.images,
            seller: item.seller
          }
        }
      ],

      totalPrice,

      // ✅ Order always starts pending
      status: "pending",

      note: note?.trim() || "",

      // ✅ Stripe flow: online still unpaid until webhook confirm
      payment: {
        method: paymentMethod,
        status: "unpaid"
      },

      paidAt: null,

      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        address: address.address
      }
    });

    // =========================================================
    // ✅ 5. REDUCE STOCK + SOLD COUNT
    // =========================================================
    item.quantity -= quantity;
    item.soldCount += quantity;

    if (item.quantity === 0 && item.status !== "hidden") {
      item.status = "sold";
    }

    await item.save();

    // =========================================================
    // ✅ 6. SEND EMAIL (KEEP YOUR TEMPLATE)
    // =========================================================
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

      <p><b>Payment Method:</b> ${order.payment.method.toUpperCase()}</p>
      <p><b>Payment Status:</b> ${order.payment.status.toUpperCase()}</p>

      ${
        order.note
          ? `<h3>Order Note</h3><p>${order.note}</p>`
          : ""
      }

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
        <span style="color:${brandColor};font-weight:bold;">
          $${totalPrice}
        </span>
      </p>
    </div>
  </div>
</body>
</html>`
      });
    } catch (err) {
      console.error("BuyNow mail failed:", err.message);
    }

    // =========================================================
    // ✅ 7. RESPONSE
    // =========================================================
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

    // ✅ 1. Find orders that belong to this seller
    const orders = await Order.find({ seller: sellerId })
      .populate("user", "firstname lastname email avatar")
      .populate("items.item", "title images price")
      .sort({ createdAt: -1 });

    // ✅ 2. Format clean response
    const formattedOrders = orders.map(order => ({
      _id: order._id,

      buyer: order.user,

      status: order.status,

      createdAt: order.createdAt,

      // ✅ Shipping snapshot
      shippingAddress: order.shippingAddress,

      // ✅ Seller items (no filter needed anymore)
      items: order.items,

      // ✅ Subtotal order
      subtotal: order.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      ),

      // ✅ Buyer note
      note: order.note || "",

      // ✅ Payment info
      payment: order.payment,

      // ✅ Refund info (if exists)
      refund: order.refund || null
    }));

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
      return res.status(400).json({
        success: false,
        msg: "Invalid status update"
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    // ✅ Update status for seller items only
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
        success: false,
        msg: "You are not allowed to update this order"
      });
    }

    // ✅ AUTO UPDATE MAIN ORDER STATUS
    const statuses = order.items.map(i => i.sellerStatus);

    if (statuses.every(s => s === "completed")) {
      order.status = "completed";
    } else if (statuses.some(s => s === "shipping")) {
      order.status = "shipping";
    } else if (statuses.every(s => s === "confirmed")) {
      order.status = "confirmed";
    }

    // ✅ FIX PAYMENT WHEN COMPLETED
    if (
      order.status === "completed" &&
      order.payment.method === "cod" &&
      order.payment.status === "unpaid"
    ) {
      order.payment.status = "paid";
      order.paidAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      msg: "Order status updated successfully",
      order
    });

  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
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

    // ✅ Ensure this order belongs to seller
    if (order.seller.toString() !== sellerId) {
      return res.status(403).json({
        msg: "You are not allowed to cancel this order"
      });
    }

    // ✅ Cannot cancel if shipping/completed
    if (["shipping", "completed"].includes(order.status)) {
      return res.status(400).json({
        msg: "Order cannot be cancelled at this stage"
      });
    }

    // ✅ Restore stock + soldCount
    for (const i of order.items) {
      await MarketplaceItem.findByIdAndUpdate(i.item, {
        $inc: {
          quantity: i.quantity,
          soldCount: -i.quantity
        }
      });
    }

    // ✅ Update order cancel info
    order.status = "cancelled";
    order.cancelledBy = "seller";
    order.cancelReason = reason || "Cancelled by seller";
    order.cancelledAt = new Date();

    // ✅ Refund online payment (Stripe)
    if (
      order.payment.method === "online" &&
      order.payment.status === "paid"
    ) {
      order.payment.status = "refund_pending";
      // refund logic handled via Refund API instead
    }

    await order.save();

    res.json({
      success: true,
      msg: "Order cancelled successfully",
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

    // ✅ Buyer only
    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "Not allowed"
      });
    }

    // ✅ Only pending/confirmed orders can be cancelled
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        msg: "This order can no longer be cancelled"
      });
    }

    // ✅ Restore stock
    for (const i of order.items) {
      await MarketplaceItem.findByIdAndUpdate(i.item, {
        $inc: {
          quantity: i.quantity,
          soldCount: -i.quantity
        }
      });
    }

    // ✅ Cancel order
    order.status = "cancelled";
    order.cancelledBy = "buyer";
    order.cancelReason = reason || "Cancelled by buyer";
    order.cancelledAt = new Date();

    // ✅ Refund logic for online payments
    if (order.payment.method === "online" && order.payment.status === "paid") {
      order.payment.status = "refund_pending";
      // Refund should be handled in Refund API (Stripe)
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
exports.reviewItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, itemId, rating, comment } = req.body;

    // ✅ 1. Validate input
    if (!orderId || !itemId) {
      return res.status(400).json({
        success: false,
        msg: "orderId and itemId are required"
      });
    }

    const parsedRating = Number(rating);

    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        msg: "Rating must be between 1 and 5"
      });
    }

    const safeComment =
      typeof comment === "string" ? comment.trim() : "";

    // ✅ 2. Load order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    // ✅ 3. Buyer only
    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "Not allowed"
      });
    }

    // ✅ 4. Order must be completed
    if (order.status !== "completed") {
      return res.status(400).json({
        success: false,
        msg: "Only completed orders can be reviewed"
      });
    }

    // ✅ 5. Find item inside order
    const itemIndex = order.items.findIndex(
      i => i.item.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(400).json({
        success: false,
        msg: "Item not found in this order"
      });
    }

    const orderItem = order.items[itemIndex];

    // ✅ 6. Prevent double review
    if (orderItem.reviewed) {
      return res.status(400).json({
        success: false,
        msg: "You already reviewed this item"
      });
    }

    const existed = await Review.findOne({
      user: userId,
      item: itemId,
      order: orderId
    });

    if (existed) {
      return res.status(400).json({
        success: false,
        msg: "You already reviewed this item"
      });
    }

    // ✅ 7. Create review
    let review = await Review.create({
      user: userId,
      item: itemId,
      order: orderId,
      rating: parsedRating,
      comment: safeComment
    });

    await review.populate("user", "firstname lastname avatar");

    // ✅ 8. Update item rating safely
    const item = await MarketplaceItem.findById(itemId);

    const newCount = item.rating.count + 1;

    const newAverage =
      (item.rating.average * item.rating.count + parsedRating) / newCount;

    await MarketplaceItem.findByIdAndUpdate(itemId, {
      $inc: { "rating.count": 1 },
      $set: {
        "rating.average": Number(newAverage.toFixed(1))
      }
    });

    // ✅ 9. Mark reviewed in order
    order.items[itemIndex].reviewed = true;

    // ✅ If all items reviewed → mark order reviewed
    const allReviewed = order.items.every(i => i.reviewed);
    if (allReviewed) {
      order.reviewed = true;
    }

    await order.save();

    // ✅ Response
    res.status(201).json({
      success: true,
      msg: "Review submitted successfully",
      review
    });

  } catch (err) {
    console.error("Review item error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};





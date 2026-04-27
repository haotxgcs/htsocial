const MarketplaceItem = require("../models/MarketplaceItemModel");
const Post = require("../models/PostModel");
const Cart = require("../models/CartModel");

// ===== 1. CREATE ITEM =====


exports.createItem = async (req, res) => {
  try {
    const { title, description, type, price, quantity, condition } = req.body;

    // ✅ images Cloudinary
    const images = req.files ? req.files.map(f => f.path) : [];

    // ✅ FIX quantity NaN
    const normalizedQuantity = Number.isFinite(Number(quantity))
      ? Number(quantity)
      : 1;

    const item = new MarketplaceItem({
      title,
      description,
      type,
      price,
      quantity: normalizedQuantity,
      condition: type === "tool" ? condition || "new" : null,
      seller: req.user.id,
      images,
      status: normalizedQuantity > 0 ? "active" : "sold",
      estimatedDeliveryDays: Number(req.body.estimatedDeliveryDays) > 0 ? Number(req.body.estimatedDeliveryDays) : 7
    });

    await item.save();

    return res.status(201).json({
      success: true,
      msg: "Item created successfully",
      item
    });

  } catch (err) {
    console.error("Create item error:", err);
    return res.status(500).json({ msg: err.message });
  }
};





// ===== 2. GET ALL ITEMS =====
exports.getAllItems = async (req, res) => {
  try {
    const { type, search, mine } = req.query;

    const filter = { status: { $ne: "hidden" } };

    // Category
    if (type) {
      filter.type = type;
    }

    // My items
    if (mine === "true") {
      if (!req.user) {
        return res.status(401).json({ msg: "Unauthorized" });
      }
      filter.seller = req.user.id;
    }


    // Search
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const items = await MarketplaceItem.find(filter)
      .populate("seller", "firstname lastname username avatar")
      .sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (err) {
    console.error("Get marketplace items error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 3. GET ITEM BY ID =====
exports.getItemById = async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id)
      .populate("seller", "firstname lastname username avatar");

    if (!item) {
      return res.status(404).json({ msg: "Item not found" });
    }

    res.status(200).json(item);
  } catch (err) {
    console.error("Get item error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 4. UPDATE ITEM =====
exports.updateItem = async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        msg: "Item not found"
      });
    }

    // ✅ CHECK OWNER
    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: "Forbidden"
      });
    }

    const {
      title,
      description,
      type,
      price,
      quantity,
      condition,
      status,
      estimatedDeliveryDays
    } = req.body;

    // ===== UPDATE BASIC FIELDS =====
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = price;
    if (estimatedDeliveryDays !== undefined && Number(estimatedDeliveryDays) > 0) {
      item.estimatedDeliveryDays = Number(estimatedDeliveryDays);
    }

    // ===== QUANTITY & STATUS LOGIC =====
    if (quantity !== undefined) {
      const normalizedQuantity = Math.max(0, Number(quantity));

      item.quantity = normalizedQuantity;

      // 🔥 AUTO STATUS BASED ON QUANTITY
      if (normalizedQuantity === 0) {
        item.status = "sold";
      } else if (item.status !== "hidden") {
        item.status = "active";
      }
    }

    // ===== MANUAL HIDE / UNHIDE =====
    if (status === "hidden") {
      item.status = "hidden";
    }

    // ===== CONDITION (TOOL ONLY) =====
    // if (item.type === "tool") {
    //   if (condition && ["new", "used"].includes(condition)) {
    //     item.condition = condition;
    //   }
    // }
    // ===== TYPE =====
    if (type !== undefined && ["ingredient", "dish", "tool"].includes(type)) {
      item.type = type;
    }

    // ===== CONDITION (dùng type MỚI, không phải type cũ) =====
    const effectiveType = type !== undefined ? type : item.type;
    if (effectiveType === "tool") {
      if (condition && ["new", "used"].includes(condition)) {
        item.condition = condition;
      }
    } else {
      // Nếu đổi từ tool sang loại khác thì xóa condition
      item.condition = null;
    }

    // ===== HANDLE REMOVED IMAGES =====
    let removedImages = req.body.removedImages || [];
    if (typeof removedImages === "string") {
      removedImages = [removedImages];
    }

    if (removedImages.length > 0) {
      item.images = item.images.filter(
        img => !removedImages.includes(img)
      );
    }

    // ===== HANDLE NEW IMAGES =====
    if (req.files && req.files.length > 0) {

      // ✅ new uploaded images = Cloudinary URL
      const newImages = req.files.map(file => file.path);
        
      item.images.push(...newImages);
    }


    await item.save();

    res.status(200).json({
      success: true,
      msg: "Item updated successfully",
      item
    });

  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
};





// ===== 5. DELETE ITEM (SOFT DELETE + UNLINK POSTS) =====
exports.deleteItem = async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ msg: "Item not found" });
    }

    // CHECK OWNER
    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    // 1️⃣ SOFT DELETE ITEM
    item.status = "hidden";
    await item.save();

    // 2️⃣ ⭐ GỠ ITEM KHỎI TẤT CẢ POST
    await Post.updateMany(
      { linkedItems: item._id },
      { $pull: { linkedItems: item._id } }
    );

    res.status(200).json({
      msg: "Item hidden and removed from all posts"
    });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
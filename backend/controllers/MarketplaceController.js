const MarketplaceItem = require("../models/MarketplaceItemModel");

// ===== 1. CREATE ITEM =====
exports.createItem = async (req, res) => {
  try {
    const { title, description, type, price, quantity, condition } = req.body;

    const images = req.files
      ? req.files.map(file => `uploads/${file.filename}`)
      : [];

    const item = new MarketplaceItem({
      title,
      description,
      type,
      price,
      quantity: quantity ?? 1,
      condition: type === "tool" ? (condition || "new") : null,
      seller: req.user.id, // ✅ FIX
      images,
      status: "active"
    });

    await item.save();

    res.status(201).json(item);
  } catch (err) {
    console.error("Create marketplace item error:", err);
    res.status(500).json({ msg: "Server error" });
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
    if (!item) return res.status(404).json({ msg: "Item not found" });

    // CHECK OWNER
    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    const allowedFields = [
      "title",
      "description",
      "price",
      "quantity",
      "condition",
      "type",
      "status"
    ];

    // ✅ UPDATE BASIC FIELDS
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    // ✅ VALIDATE STATUS
    if (req.body.status) {
      if (!["active", "sold", "hidden"].includes(req.body.status)) {
        return res.status(400).json({ msg: "Invalid status" });
      }
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
      const newImages = req.files.map(
        file => `uploads/${file.filename}`
      );
      item.images.push(...newImages);
    }


    // ✅ VALIDATE CONDITION
    if (item.type === "tool") {
      if (!["new", "used"].includes(item.condition)) {
        item.condition = "new";
      }
    }


    await item.save();
    res.status(200).json(item);
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};




// ===== 5. DELETE ITEM =====
exports.deleteItem = async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });

    if (item.seller.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    // Soft delete (KHUYÊN DÙNG)
    item.status = "hidden";
    await item.save();



    res.status(200).json({ msg: "Item deleted" });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


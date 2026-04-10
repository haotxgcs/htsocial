const User = require("../models/UserModel");
const Post = require("../models/PostModel");
const Share = require("../models/ShareModel");
const Comment = require("../models/CommentModel");
const MarketplaceItem = require("../models/MarketplaceItemModel");
const Report = require("../models/ReportModel");

// ── Auth middleware: admin only ───────────────────────────────────
exports.requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }
    next();
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// DASHBOARD STATS
// GET /admin/stats
// =============================================
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, bannedUsers, totalPosts, totalShares, totalItems, pendingReports] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      User.countDocuments({ banned: true }),
      Post.countDocuments(),
      Share.countDocuments(),
      MarketplaceItem.countDocuments(),
      Report.countDocuments({ status: "pending" })
    ]);

    res.json({
      success: true,
      stats: { totalUsers, bannedUsers, totalPosts, totalShares, totalItems, pendingReports }
    });
  } catch (err) {
    console.error("getStats:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// USER MANAGEMENT
// GET /admin/users?page=1&limit=20&search=
// =============================================
exports.getUsers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)   || 1;
    const limit  = parseInt(req.query.limit)  || 20;
    const search = req.query.search?.trim()   || "";
    const status = req.query.status || "all";

    const query = { role: { $ne: "admin" } };

    if (status === "banned") query.banned = true;
    if (status === "active") query.banned = { $ne: true };

    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: "i" } },
        { lastname:  { $regex: search, $options: "i" } },
        { username:  { $regex: search, $options: "i" } },
        { email:     { $regex: search, $options: "i" } },
      ];
    }

    

    const [users, total] = await Promise.all([
      User.find(query)
        .select("firstname lastname username email avatar role banned createdAt postCount")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query)
    ]);


    res.json({ success: true, users, total, page, hasMore: page * limit < total });
  } catch (err) {
    console.error("getUsers:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// BAN USER
// PATCH /admin/users/:id/ban
// =============================================
exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.role === "admin") return res.status(403).json({ msg: "Cannot ban admin" });

    user.banned = true;
    await user.save();

    res.json({ success: true, msg: "User banned successfully" });
  } catch (err) {
    console.error("banUser:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// UNBAN USER
// PATCH /admin/users/:id/unban
// =============================================
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.banned = false;
    await user.save();

    res.json({ success: true, msg: "User unbanned successfully" });
  } catch (err) {
    console.error("unbanUser:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// POST MANAGEMENT
// GET /admin/posts?page=1&limit=20&search=
// =============================================
exports.getPosts = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const search = req.query.search?.trim()  || "";

    const query = {};
    if (search) {
      query.$or = [
        { title:        { $regex: search, $options: "i" } },
        { ingredients:  { $regex: search, $options: "i" } },
        { category:     { $regex: search, $options: "i" } },
      ];
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate("author", "firstname lastname username avatar")
        .select("title category media mediaType createdAt likes commentCount author")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Post.countDocuments(query)
    ]);

    res.json({ success: true, posts, total, page, hasMore: page * limit < total });
  } catch (err) {
    console.error("getPosts:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// DELETE POST (admin)
// DELETE /admin/posts/:id
// =============================================
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    await Comment.deleteMany({ post: post._id });
    await User.findByIdAndUpdate(post.author, { $inc: { postCount: -1 } });

    res.json({ success: true, msg: "Post deleted" });
  } catch (err) {
    console.error("admin deletePost:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// SHARE MANAGEMENT
// GET /admin/shares?page=1&limit=20
// =============================================
exports.getShares = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [shares, total] = await Promise.all([
      Share.find()
        .populate("username", "firstname lastname username avatar")
        .populate({ path: "post", select: "title category author", populate: { path: "author", select: "firstname lastname" } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Share.countDocuments()
    ]);

    res.json({ success: true, shares, total, page, hasMore: page * limit < total });
  } catch (err) {
    console.error("getShares:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// DELETE SHARE (admin)
// DELETE /admin/shares/:id
// =============================================
exports.deleteShare = async (req, res) => {
  try {
    const share = await Share.findByIdAndDelete(req.params.id);
    if (!share) return res.status(404).json({ msg: "Share not found" });

    await Post.findByIdAndUpdate(share.post, { $inc: { sharesCount: -1 } });

    res.json({ success: true, msg: "Share deleted" });
  } catch (err) {
    console.error("admin deleteShare:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// MARKETPLACE MANAGEMENT
// GET /admin/items?page=1&limit=20&search=
// =============================================
exports.getItems = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const search = req.query.search?.trim()  || "";

    const query = {};
    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      MarketplaceItem.find(query)
        .populate("seller", "firstname lastname username avatar")
        .select("title price images status type rating seller createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      MarketplaceItem.countDocuments(query)
    ]);

    res.json({ success: true, items, total, page, hasMore: page * limit < total });
  } catch (err) {
    console.error("getItems:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// =============================================
// DELETE ITEM (admin)
// DELETE /admin/items/:id
// =============================================
exports.deleteItem = async (req, res) => {
  try {
    const item = await MarketplaceItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ msg: "Item not found" });

    res.json({ success: true, msg: "Item deleted" });
  } catch (err) {
    console.error("admin deleteItem:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
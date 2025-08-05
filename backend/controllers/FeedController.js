// controllers/FeedController.js
const Post = require("../models/PostModel");
const Share = require("../models/ShareModel");
const User = require("../models/UserModel");

exports.getUnifiedFeed = async (req, res) => {
  try {
    const { viewerId } = req.params;

    const user = await User.findById(viewerId).populate("friends");
    if (!user) return res.status(404).json({ msg: "User not found" });

    // ===== LẤY BÀI VIẾT GỐC =====
    const posts = await Post.find()
      .populate("author", "firstname lastname username avatar friends")
      .sort({ createdAt: -1 });

    const visiblePosts = posts.filter(post => {
      const isAuthor = post.author._id.equals(viewerId);
      const isFriend = post.author.friends.includes(viewerId);
      const isHidden = post.hiddenBy.includes(viewerId);
      if (isHidden) return false;

      switch (post.audience) {
        case "public": return true;
        case "friends": return isFriend || isAuthor;
        case "private": return isAuthor;
        default: return false;
      }
    });

    // ===== LẤY BÀI CHIA SẺ =====
    const shares = await Share.find()
      .populate("username", "firstname lastname username avatar friends")
      .populate({
        path: "post",
        populate: {
          path: "author",
          select: "firstname lastname username avatar friends"
        }
      })
      .sort({ createdAt: -1 });

    const visibleShares = shares.filter(share => {
      const sharer = share.username;
      if (!sharer) return false;

      // ✅ Nếu user đã ẩn share này → bỏ qua
      const isHidden = user.hiddenShares.some(id => id.toString() === share._id.toString());
      if (isHidden) return false;

      // Nếu bài post bị xóa → vẫn giữ lại share để frontend hiển thị "This post is deleted"
      if (!share.post) return true;

      const isAuthor = sharer._id.equals(viewerId);
      const isFriend = sharer.friends.includes(viewerId);

      switch (share.audience) {
        case "public": return true;
        case "friends": return isFriend || isAuthor;
        case "private": return isAuthor;
        default: return false;
      }
    });

    const formattedPosts = visiblePosts.map(p => ({ ...p.toObject(), type: "post" }));

    const formattedShares = visibleShares.map(s => {
      const share = s.toObject();
      const post = share.post;

      let canViewPost = false;

      if (!post || !post.author) {
        return { ...share, canViewPost: false, type: "share" };
      }

      const postAuthor = post.author;
      const isPostAuthor = postAuthor._id.toString() === viewerId;
      const isFriend = postAuthor.friends.includes(viewerId);

      switch (post.audience) {
        case "public":
          canViewPost = true;
          break;
        case "friends":
          canViewPost = isPostAuthor || isFriend;
          break;
        case "private":
          canViewPost = isPostAuthor;
          break;
        default:
          canViewPost = false;
      }

      return { ...share, canViewPost, type: "share" };
    });

    const allFeed = [...formattedPosts, ...formattedShares].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json(allFeed);
  } catch (err) {
    console.error("Unified feed error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getHiddenShares = async (req, res) => {
  try {
    const { viewerId } = req.params;
    const user = await User.findById(viewerId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const hiddenShares = await Share.find({
      _id: { $in: user.hiddenShares }
    })
      .populate("username", "firstname lastname username avatar friends")
      .populate({
        path: "post",
        select: "content audience media mediaType createdAt author",
        populate: {
          path: "author",
          select: "firstname lastname username avatar friends"
        }
      })
      .sort({ createdAt: -1 });

    const result = hiddenShares.map(s => ({
      ...s.toObject(),
      type: "share"
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Get hidden shares error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// GET /feeds/hidden-posts/:viewerId
exports.getHiddenPosts = async (req, res) => {
  try {
    const { viewerId } = req.params;

    const user = await User.findById(viewerId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Tìm các bài viết mà user đã ẩn
    const hiddenPosts = await Post.find({
      _id: { $in: user.hiddenPosts || [] }
    })
      .populate("author", "firstname lastname username avatar friends")
      .sort({ createdAt: -1 });

    // Gắn type để phân biệt khi frontend gộp
    const result = hiddenPosts.map(p => ({
      ...p.toObject(),
      type: "post"
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching hidden posts:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

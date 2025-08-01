// controllers/FeedController.js
const Post = require("../models/PostModel");
const Share = require("../models/ShareModel");
const User = require("../models/UserModel");

exports.getUnifiedFeed = async (req, res) => {
  try {
    const { viewerId } = req.params;

    const user = await User.findById(viewerId).populate("friends");
    if (!user) return res.status(404).json({ msg: "User not found" });

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

  // Nếu bài post bị xóa, ta vẫn giữ share để frontend hiển thị "This post is deleted"
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
    const formattedShares = visibleShares.map(s => ({ ...s.toObject(), type: "share" }));

    const allFeed = [...formattedPosts, ...formattedShares].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json(allFeed);
  } catch (err) {
    console.error("Unified feed error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

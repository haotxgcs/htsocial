const Share = require("../models/ShareModel");
const Post = require("../models/PostModel");
const User = require("../models/UserModel");

// Tạo chia sẻ bài viết
exports.sharePost = async (req, res) => {
  try {
    const { username, content } = req.body;
    const postId = req.params.id;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const newShare = new Share({
      username: user._id,
      post: post._id,
      content,
    });

    await newShare.save();

    post.sharesCount += 1;
    await post.save();

    res.status(201).json({
      msg: "Post shared successfully",
      share: newShare,
    });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Lấy danh sách share
exports.getAllShares = async (req, res) => {
  try {
    const shares = await Share.find()
      .populate("username", "firstname lastname username avatar")
      .populate("post", "content image");

    res.status(200).json(shares);
  } catch (err) {
    console.error("Get shares error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Cập nhật nội dung chia sẻ
exports.updateShare = async (req, res) => {
  try {
    const { content } = req.body;
    const share = await Share.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    );

    if (!share) return res.status(404).json({ msg: "Share not found" });

    res.status(200).json({ msg: "Share updated", share });
  } catch (err) {
    console.error("Update share error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Xóa chia sẻ
exports.deleteShare = async (req, res) => {
  try {
    const share = await Share.findByIdAndDelete(req.params.id);
    if (!share) return res.status(404).json({ msg: "Share not found" });

    // Giảm sharesCount trong post
    await Post.findByIdAndUpdate(share.post, { $inc: { sharesCount: -1 } });

    res.status(200).json({ msg: "Share deleted" });
  } catch (err) {
    console.error("Delete share error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

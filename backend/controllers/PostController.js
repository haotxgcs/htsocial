const Post = require("../models/PostModel");
const User = require("../models/UserModel");
const Comment = require("../models/CommentModel");
const Share = require("../models/ShareModel");

exports.createPost = async (req, res) => {
  try {
    const { content, author,audience,hiddenBy } = req.body;
    const media = req.file ? `uploads/${req.file.filename}` : null;
    const mediaType = req.file
      ? req.file.mimetype.startsWith("image")
        ? "image"
        : req.file.mimetype.startsWith("video")
        ? "video"
        : null
      : null;

    // Tìm user theo username
    const existingUser = await User.findOne({ username: author });
    if (!existingUser) {
      return res.status(400).json({ msg: "Author does not exist" });
    }

    // Tạo post mới
    const newPost = new Post({
      content,
      author: existingUser._id,
      media,
      mediaType,
      audience: audience || "public",
      hiddenBy: hiddenBy || [],
    });

    await newPost.save();

    // Cập nhật postCount
    await User.findByIdAndUpdate(existingUser._id, {
      $inc: { postCount: 1 }
    });

    // Populate thông tin author
    const populatedPost = await Post.findById(newPost._id)
      .populate("author", "firstname lastname username");

    res.status(201).json({
      msg: "Post created successfully",
      post: populatedPost
    });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.getAllPosts = async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const hiddenIds = user.hiddenPosts || [];

    const posts = await Post.find({
      _id: { $nin: hiddenIds }  // 👈 loại bỏ các bài user đã hide
    })
      .populate("author", "firstname lastname username")
      .sort({ createdAt: -1 });

    const postsWithLikeCount = posts.map(post => ({
      ...post.toObject(),
      likesCount: post.likes.length,
      commentCount: post.commentCount
    }));

    res.status(200).json(postsWithLikeCount);
  } catch (err) {
    console.error("Get all posts error:", err);
    res.status(500).json({ msg: "Error fetching posts" });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "firstname lastname username");

    if (!post) return res.status(404).json({ msg: "Post not found" });

    const postWithLikeCount = {
      ...post.toObject(),
      likesCount: post.likes.length
    };

    res.status(200).json(postWithLikeCount);
  } catch (err) {
    console.error("Get post by ID error:", err);
    res.status(500).json({ msg: "Error fetching post" });
  }
};

// get post and share by user
exports.getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Lấy post gốc
    const posts = await Post.find({ author: userId })
      .populate("author", "firstname lastname username avatar")
      .sort({ createdAt: -1 })
      .lean();

    // Lấy bài share
    const shares = await Share.find({ username: userId })
      .populate("username", "firstname lastname username avatar")
      .populate({
        path: "post",
        populate: {
          path: "author",
          select: "firstname lastname username avatar"
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Gắn type cho từng loại
    const postsWithType = posts.map(p => ({ ...p, type: "original" }));
    const sharesWithType = shares.map(s => ({ ...s, type: "share" }));

    // Merge + sort lại theo thời gian
    const merged = [...postsWithType, ...sharesWithType].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json(merged);
  } catch (err) {
    console.error("Get posts+shares by user error:", err);
    res.status(500).json({ msg: "Error fetching user's posts" });
  }
};



exports.getVisiblePosts = async (req, res) => {
  try {
    const viewerId = req.params.viewerId;

    const allPosts = await Post.find()
      .populate("author", "firstname lastname username avatar friends")
       .populate("post")
      .sort({ createdAt: -1 });

    const visiblePosts = allPosts.filter(post => {
      const isAuthor = post.author._id.toString() === viewerId;
      const isFriend = post.author.friends.includes(viewerId);
      const isHidden = post.hiddenBy.includes(viewerId); // loại bỏ bài bị ẩn

      if (isHidden) return false;

      switch (post.audience) {
        case "public":
          return true;
        case "friends":
          return isFriend || isAuthor;
        case "private":
          return isAuthor;
        default:
          return false;
      }
    });

    res.status(200).json(visiblePosts);
  } catch (err) {
    console.error("Error loading visible posts:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.getHiddenPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate({
      path: "hiddenPosts",
      populate: {
        path: "author",
        select: "firstname lastname username"
      }
    });

    if (!user) return res.status(404).json({ msg: "User not found" });

    const hiddenPosts = user.hiddenPosts
      .map(post => ({
        ...post.toObject(),
        likesCount: post.likes.length
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(hiddenPosts);
  } catch (err) {
    console.error("Get hidden posts error:", err);
    res.status(500).json({ msg: "Error fetching hidden posts" });
  }
};


exports.updatePost = async (req, res) => {
  try {
    const { content,audience } = req.body;
    const file = req.file;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (content) post.content = content;
    if (audience) post.audience = audience;

    if (file) {
      post.media = file.path;
      post.mediaType = file.mimetype.startsWith("image") ? "image" :
                       file.mimetype.startsWith("video") ? "video" : null;
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("author", "firstname lastname username");

    res.status(200).json({ msg: "Post updated", post: updatedPost });
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ msg: "Error updating post" });
  }
};


exports.deletePost = async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: "Post not found" });

    // Giảm postCount
    await User.findByIdAndUpdate(deleted.author, {
      $inc: { postCount: -1 }
    });

    // Gỡ postId khỏi likedPosts của tất cả users
    await User.updateMany(
      { likedPosts: deleted._id },
      { $pull: { likedPosts: deleted._id } }
    );

    await Comment.deleteMany({ post: deleted._id });
    // await Share.deleteMany({ post: deleted._id });

    res.json({ msg: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ msg: "Error deleting post" });
  }
};  

exports.hidePost = async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId } = req.params;

    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!user || !post) return res.status(404).json({ msg: "User or post not found" });

    if (post.author.toString() === userId) {
      return res.status(400).json({ msg: "You cannot hide your own post" });
    }

    if (!user.hiddenPosts.includes(postId)) user.hiddenPosts.push(postId);
    if (!post.hiddenBy.includes(userId)) post.hiddenBy.push(userId);

    await user.save();
    await post.save();

    res.status(200).json({ msg: "Post hidden successfully" });
  } catch (err) {
    console.error("Hide post error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.unhidePost = async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId } = req.params;

    const user = await User.findById(userId);
    const post = await Post.findById(postId);
    if (!user || !post) return res.status(404).json({ msg: "User or post not found" });

    // Gỡ khỏi danh sách
    user.hiddenPosts = user.hiddenPosts.filter(id => id.toString() !== postId);
    post.hiddenBy = post.hiddenBy.filter(id => id.toString() !== userId);

    await user.save();
    await post.save();

    res.status(200).json({ msg: "Post unhidden successfully" });
  } catch (err) {
    console.error("Unhide post error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const { username } = req.body;

    // Tìm user theo username
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = user._id;
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      // Unlike
      post.likes.pull(userId);
      user.likedPosts.pull(postId); // 👈 Gỡ postId khỏi likedPosts
    } else {
      // Like
      post.likes.push(userId);
      user.likedPosts.push(postId); // 👈 Thêm postId vào likedPosts
    }

    await post.save();
    await user.save(); // 👈 Lưu lại user sau khi thay đổi

    res.status(200).json({
      msg: hasLiked ? "Post unliked" : "Post liked",
      likes: post.likes, 
      postId: post._id,
      author: {
        username: user.username,
        id: user._id
      },
      likesCount: post.likes.length
    });
  } catch (err) {
    console.error("Toggle like error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};



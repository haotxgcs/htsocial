const Post = require("../models/PostModel");
const User = require("../models/UserModel");
const Comment = require("../models/CommentModel");
const Share = require("../models/ShareModel");

// Tạo post mới hỗ trợ cả ảnh và video
exports.createPost = async (req, res) => {
  try {
    const { content, author,audience } = req.body;
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
      audience: audience || "public"
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
    const posts = await Post.find()
      .populate("author", "firstname lastname username")
      .sort({ createdAt: -1 });

    // Map lại để thêm trường likesCount
    const postsWithLikeCount = posts.map(post => ({
      ...post.toObject(),
      likesCount: post.likes.length
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

exports.getVisiblePosts = async (req, res) => {
  try {
    const viewerId = req.params.viewerId;

    const allPosts = await Post.find()
      .populate('author', 'firstname lastname username avatar friends')
      .sort({ createdAt: -1 });

    const visiblePosts = allPosts.filter(post => {
      const isAuthor = post.author._id.toString() === viewerId;
      const isFriend = post.author.friends.includes(viewerId);

      switch (post.audience) {
        case 'public':
          return true;
        case 'friends':
          return isFriend || isAuthor;
        case 'private':
          return isAuthor;
        default:
          return false;
      }
    });

    res.status(200).json(visiblePosts);
  } catch (err) {
    console.error('Error loading visible posts:', err);
    res.status(500).json({ msg: 'Server error' });
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

// controllers/PostController.js
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


// Xóa post
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
    await Share.deleteMany({ post: deleted._id });

    res.json({ msg: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ msg: "Error deleting post" });
  }
};

// Hide post by user
exports.hidePost = async (req, res) => {
  try {
    const { userId } = req.body;  // người dùng muốn ẩn bài
    const { postId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (!user.hiddenPosts.includes(postId)) {
      user.hiddenPosts.push(postId);
      await user.save();
    }

    res.status(200).json({ msg: "Post hidden successfully" });
  } catch (err) {
    console.error("Hide post error:", err);
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


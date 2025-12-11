// ===== FeedController.js =====
const Post = require("../models/PostModel");
const Share = require("../models/ShareModel");
const User = require("../models/UserModel");

exports.getUnifiedFeed = async (req, res) => {
  try {
    const { viewerId } = req.params;

    const user = await User.findById(viewerId).populate("friends");
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 1. GET POSTS
    const posts = await Post.find()
      .populate("author", "firstname lastname username avatar friends")
      .sort({ createdAt: -1 });

    const visiblePosts = posts.filter(post => {
      const authorId = post.author._id.toString(); // Chuyển về String
      const isAuthor = authorId === viewerId;
      
      // So sánh mảng friends an toàn
      const isFriend = post.author.friends.some(f => f._id.toString() === viewerId);
      
      const isHidden = post.hiddenBy.some(id => id.toString() === viewerId);
      if (isHidden) return false;

      switch (post.audience) {
        case "public": return true;
        case "friends": return isFriend || isAuthor;
        case "private": return isAuthor;
        default: return false;
      }
    });

    // 2. GET SHARES
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
      if (!share.username) return false; // Skip if sharer deleted account

      const isHidden = user.hiddenShares.some(id => id.toString() === share._id.toString());
      if (isHidden) return false;

      const sharerId = share.username._id.toString();
      const isSharerMe = sharerId === viewerId;
      const isFriendWithSharer = share.username.friends.some(f => f._id.toString() === viewerId);

      switch (share.audience) {
        case "public": return true;
        case "friends": return isFriendWithSharer || isSharerMe;
        case "private": return isSharerMe;
        default: return false;
      }
    });

    const formattedPosts = visiblePosts.map(p => ({ ...p.toObject(), type: "post" }));

    const formattedShares = visibleShares.map(s => {
      const share = s.toObject();
      const post = share.post;

      let canViewPost = false;

      // Nếu post tồn tại, kiểm tra quyền xem bài GỐC
      if (post && post.author) {
        const postAuthorId = post.author._id.toString();
        const isPostAuthor = postAuthorId === viewerId;
        const isFriendWithPostAuthor = post.author.friends.some(f => f._id.toString() === viewerId);

        switch (post.audience) {
          case "public": canViewPost = true; break;
          case "friends": canViewPost = isPostAuthor || isFriendWithPostAuthor; break;
          case "private": canViewPost = isPostAuthor; break;
          default: canViewPost = false;
        }
      } else {
        // Nếu post null (đã xóa thật sự trong DB), thì canView = false
        canViewPost = false;
      }

      return { 
        ...share, 
        // Quan trọng: Luôn trả về post object (dù là null) để frontend xử lý
        post: post || null, 
        canViewPost, 
        type: "share",
        commentCount: share.commentCount || 0,
        replyCommentCount: share.replyCommentCount || 0
      };
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

exports.getUserFeed = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ author: userId })
      .populate("author", "firstname lastname username avatar friends")
      .lean();

    const shares = await Share.find({ username: userId })
      .populate("username", "firstname lastname username avatar friends")
      .populate({
        path: "post",
        populate: {
          path: "author",
          select: "firstname lastname username avatar friends",
        },
      })
      .lean();

    const formattedPosts = posts.map((p) => ({
      ...p,
      type: "original",
    }));

    const formattedShares = shares.map((s) => ({
      ...s,
      type: "share",
      commentCount: s.commentCount || 0,
      replyCommentCount: s.replyCommentCount || 0
    }));

    const allFeed = [...formattedPosts, ...formattedShares].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json(allFeed);
  } catch (err) {
    console.error("User feed error:", err);
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
        select: "title category ingredients instructions audience media mediaType createdAt author",
        populate: {
          path: "author",
          select: "firstname lastname username avatar friends"
        }
      })
      .sort({ createdAt: -1 });

    const result = hiddenShares.map(s => ({
      ...s.toObject(),
      type: "share",
      commentCount: s.commentCount || 0,
      replyCommentCount: s.replyCommentCount || 0
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Get hidden shares error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getHiddenPosts = async (req, res) => {
  try {
    const { viewerId } = req.params;

    const user = await User.findById(viewerId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const hiddenPosts = await Post.find({
      _id: { $in: user.hiddenPosts || [] }
    })
      .populate("author", "firstname lastname username avatar friends")
      .sort({ createdAt: -1 });

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

// ===== SAVED POSTS FUNCTIONALITY (CHỈ POST, KHÔNG SHARE) =====

exports.getSavedItems = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!user.savedPosts || user.savedPosts.length === 0) {
      return res.json([]);
    }

    // Chỉ lấy Posts, không lấy Shares
    const savedPosts = await Post.find({
      _id: { $in: user.savedPosts }
    })
    .populate("author", "firstname lastname username avatar friends")
    .lean();

    // Format và filter
    const formattedPosts = savedPosts
      .filter(post => {
        if (!post || !post.author) return false;
        
        const authorId = post.author._id.toString();
        const viewerId = userId;
        const isAuthor = authorId === viewerId;
        const isFriend = post.author.friends && post.author.friends.includes(viewerId);

        switch (post.audience) {
          case 'public': return true;
          case 'friends': return isAuthor || isFriend;
          case 'private': return isAuthor;
          default: return false;
        }
      })
      .map(post => ({
        ...post,
        type: 'post',
        likesCount: post.likes ? post.likes.length : 0,
        commentCount: post.commentCount || 0,
        savesCount: post.savesCount || 0 // THÊM savesCount
        
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(formattedPosts);

  } catch (error) {
    console.error('Get saved items error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

exports.toggleSaveItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId, action } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Chỉ cho phép save Post, không save Share
    const post = await Post.findById(itemId);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const isSaved = user.savedPosts && user.savedPosts.includes(itemId);

    if (action === 'save') {
      if (!isSaved) {
        if (!user.savedPosts) user.savedPosts = [];
        user.savedPosts.push(itemId);
        await user.save();
        
        // TĂNG savesCount trong Post
        await Post.findByIdAndUpdate(itemId, {
          $inc: { savesCount: 1 }
        });
        
        res.json({ 
          msg: 'Post saved successfully',
          saved: true,
          itemId: itemId,
          itemType: 'post',
          savesCount: (post.savesCount || 0) + 1
        });
      } else {
        res.json({ 
          msg: 'Post already saved',
          saved: true,
          itemId: itemId,
          itemType: 'post',
          savesCount: post.savesCount || 0
        });
      }
    } else if (action === 'unsave') {
      if (isSaved) {
        user.savedPosts = user.savedPosts.filter(id => id.toString() !== itemId);
        await user.save();
        
        // GIẢM savesCount trong Post
        await Post.findByIdAndUpdate(itemId, {
          $inc: { savesCount: -1 }
        });
        
        res.json({ 
          msg: 'Post unsaved successfully',
          saved: false,
          itemId: itemId,
          itemType: 'post',
          savesCount: Math.max(0, (post.savesCount || 0) - 1)
        });
      } else {
        res.json({ 
          msg: 'Post was not saved',
          saved: false,
          itemId: itemId,
          itemType: 'post',
          savesCount: post.savesCount || 0
        });
      }
    } else {
      res.status(400).json({ msg: 'Invalid action. Use "save" or "unsave"' });
    }

  } catch (error) {
    console.error('Save/Unsave item error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getSavedItemIds = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const savedItemIds = user.savedPosts || [];
    
    res.json({ 
      savedItems: savedItemIds
    });

  } catch (error) {
    console.error('Get saved item IDs error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};
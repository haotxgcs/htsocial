// controllers/FeedController.js
const Post = require("../models/PostModel");
const Share = require("../models/ShareModel");
const User = require("../models/UserModel");

exports.getUnifiedFeed = async (req, res) => {
  try {
    const { viewerId } = req.params;

    const user = await User.findById(viewerId).populate("friends");
    if (!user) return res.status(404).json({ msg: "User not found" });

    // ===== Lấy bài viết gốc =====
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

    // ===== Lấy bài chia sẻ =====
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

      // Nếu user đã ẩn share này → bỏ qua
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

exports.getUserFeed = async (req, res) => {
  try {
    const { userId } = req.params;

    // Lấy bài viết gốc
    const posts = await Post.find({ author: userId })
      .populate("author", "firstname lastname username avatar friends")
      .lean();

    // Lấy share
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

    // Format giống homepage
    const formattedPosts = posts.map((p) => ({
      ...p,
      type: "original", // Đổi thành 'original' để khớp với v-if trong template
    }));

    const formattedShares = shares.map((s) => ({
      ...s,
      type: "share",
    }));

    // Gộp + sort theo thời gian
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

// ===== SAVED POSTS FUNCTIONALITY =====

exports.getSavedItems = async (req, res) => {
  try {
    const { userId } = req.params;
    // console.log('Getting saved items for userId:', userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ msg: 'User not found' });
    }

    // console.log('User found:', user.username);
    // console.log('User savedPosts:', user.savedPosts?.length || 0);

    if (!user.savedPosts || user.savedPosts.length === 0) {
      console.log('No saved items found');
      return res.json([]);
    }

    // ===== Lấy saved Posts =====
    const savedPosts = await Post.find({
      _id: { $in: user.savedPosts }
    })
    .populate("author", "firstname lastname username avatar friends")
    .lean();

    // ===== Lấy saved Shares =====
    const savedShares = await Share.find({
      _id: { $in: user.savedPosts }
    })
    .populate("username", "firstname lastname username avatar friends")
    .populate({
      path: "post",
      populate: {
        path: "author",
        select: "firstname lastname username avatar friends"
      }
    })
    .lean();

    // console.log('Found saved posts:', savedPosts.length);
    // console.log('Found saved shares:', savedShares.length);

    // ===== Format Posts =====
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
        commentCount: post.commentCount || 0
      }));

    // ===== Format Shares =====
    const formattedShares = savedShares
      .filter(share => {
        if (!share || !share.username) return false;

        const sharerId = share.username._id.toString();
        const viewerId = userId;
        const isSharer = sharerId === viewerId;
        const isFriend = share.username.friends && share.username.friends.includes(viewerId);

        // Check share visibility
        let canViewShare = false;
        switch (share.audience) {
          case 'public': canViewShare = true; break;
          case 'friends': canViewShare = isSharer || isFriend; break;
          case 'private': canViewShare = isSharer; break;
          default: canViewShare = false;
        }

        return canViewShare;
      })
      .map(share => {
        const post = share.post;
        let canViewPost = false;

        // Check if can view the original post
        if (post && post.author) {
          const postAuthorId = post.author._id.toString();
          const viewerId = userId;
          const isPostAuthor = postAuthorId === viewerId;
          const isPostFriend = post.author.friends && post.author.friends.includes(viewerId);

          switch (post.audience) {
            case 'public': canViewPost = true; break;
            case 'friends': canViewPost = isPostAuthor || isPostFriend; break;
            case 'private': canViewPost = isPostAuthor; break;
            default: canViewPost = false;
          }
        }

        return {
          ...share,
          type: 'share',
          canViewPost,
          likesCount: post && post.likes ? post.likes.length : 0,
          commentCount: post ? (post.commentCount || 0) : 0
        };
      });

    // ===== Combine và sort =====
    const allSavedItems = [...formattedPosts, ...formattedShares]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // console.log('Returning saved items count:', allSavedItems.length);
    // console.log('Posts:', formattedPosts.length, 'Shares:', formattedShares.length);
    
    res.json(allSavedItems);

  } catch (error) {
    console.error('Get saved items error:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

exports.toggleSaveItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { userId, action } = req.body; // action: 'save' hoặc 'unsave'

    // Kiểm tra user tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Kiểm tra item tồn tại (có thể là Post hoặc Share)
    let item = await Post.findById(itemId);
    let itemType = 'post';
    
    if (!item) {
      item = await Share.findById(itemId);
      itemType = 'share';
    }

    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }

    // Kiểm tra xem user đã save item này chưa
    const isSaved = user.savedPosts && user.savedPosts.includes(itemId);

    if (action === 'save') {
      if (!isSaved) {
        // Thêm item vào savedPosts
        if (!user.savedPosts) user.savedPosts = [];
        user.savedPosts.push(itemId);
        await user.save();
        
        res.json({ 
          msg: `${itemType} saved successfully`,
          saved: true,
          itemId: itemId,
          itemType: itemType
        });
      } else {
        res.json({ 
          msg: `${itemType} already saved`,
          saved: true,
          itemId: itemId,
          itemType: itemType
        });
      }
    } else if (action === 'unsave') {
      if (isSaved) {
        // Xóa item khỏi savedPosts
        user.savedPosts = user.savedPosts.filter(id => id.toString() !== itemId);
        await user.save();
        
        res.json({ 
          msg: `${itemType} unsaved successfully`,
          saved: false,
          itemId: itemId,
          itemType: itemType
        });
      } else {
        res.json({ 
          msg: `${itemType} was not saved`,
          saved: false,
          itemId: itemId,
          itemType: itemType
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

    // Trả về danh sách ID của saved items
    const savedItemIds = user.savedPosts || [];
    
    res.json({ 
      savedItems: savedItemIds
    });

  } catch (error) {
    console.error('Get saved item IDs error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};
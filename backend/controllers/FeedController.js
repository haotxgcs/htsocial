// ===== FeedController.js =====
const Post = require("../models/PostModel");
const Share = require("../models/ShareModel");
const User = require("../models/UserModel");

const isFriendOf = (friends = [], viewerId) => {
  return friends.some(f =>
    (f?._id ? f._id.toString() : f.toString()) === viewerId
  );
};

const canViewPost = (post, viewerId) => {
  if (!post || !post.author) return false;
  if (!viewerId) return post.audience === "public";

  const viewer = viewerId.toString();
  const authorId = post.author._id.toString();
  const isAuthor = authorId === viewer;
  const isFriend = isFriendOf(post.author.friends, viewer);

  switch (post.audience) {
    case "public":
      return true;
    case "friends":
      return isAuthor || isFriend;
    case "private":
      return isAuthor;
    default:
      return false;
  }
};

const canViewShare = (share, viewerId) => {
  if (!share || !share.username) return false;
  if (!viewerId) return share.audience === "public";

  const viewer = viewerId.toString();
  const sharerId = share.username._id.toString();
  const isSharer = sharerId === viewer;
  const isFriend = isFriendOf(share.username.friends, viewer);

  switch (share.audience) {
    case "public":
      return true;
    case "friends":
      return isSharer || isFriend;
    case "private":
      return isSharer;
    default:
      return false;
  }
};



exports.getUnifiedFeed = async (req, res) => {
  try {
    const { viewerId } = req.params;

    const user = await User.findById(viewerId).populate("friends");
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 1. GET POSTS
    const posts = await Post.find()
      .populate("author", "firstname lastname username avatar friends")
      .populate({
        path: "linkedItems",
        populate: {
          path: "seller",
          select: "firstname lastname username avatar"
        }
      })
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
        populate: [
          {
            path: "author",
            select: "firstname lastname username avatar friends"
          },
          {
            path: "linkedItems",
            populate: {
              path: "seller",
              select: "firstname lastname username avatar"
            }
          }
        ]
      })
      .sort({ createdAt: -1 });

      const visibleShares = shares.filter(share => {
        if (!share.username) return false;

        const isHidden = user.hiddenShares.some(
          id => id.toString() === share._id.toString()
        );
        if (isHidden) return false;

        // ✅ CHỈ check share
        return canViewShare(share, viewerId);
      });



    const formattedPosts = visiblePosts.map(p => ({ ...p.toObject(), type: "post" }));

    const formattedShares = visibleShares.map(s => {
      const share = s.toObject();
      const originalPost = share.post;

      const canViewOriginalPost = canViewPost(originalPost, viewerId);

      return {
        ...share,
        type: "share",

        // 🔥 CỐT LÕI
        post: canViewOriginalPost ? originalPost : null,
        canViewPost: canViewOriginalPost,

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
    const { viewerId } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // =========================
    // 1. LOAD VIEWER (NGƯỜI ĐANG XEM)
    // =========================
    let viewer = null;
    if (viewerId) {
      viewer = await User.findById(viewerId)
        .select("hiddenPosts hiddenShares friends")
        .lean();
    }

    // =========================
    // 2. LOAD POSTS (OWNER)
    // =========================
    let posts = await Post.find({ author: userId })
      .populate("author", "firstname lastname username avatar friends")
      .populate({
        path: "linkedItems",
        select: "title images type condition seller",
        populate: {
          path: "seller",
          select: "firstname lastname username avatar"
        }
      })

      .lean();

    // 👉 FILTER HIDDEN POSTS (THEO VIEWER)
    if (viewer?.hiddenPosts?.length) {
      posts = posts.filter(
        p => !viewer.hiddenPosts.some(
          id => id.toString() === p._id.toString()
        )
      );
    }

    // 👉 FILTER AUDIENCE
    posts = posts.filter(post => canViewPost(post, viewerId));


    // =========================
    // 3. LOAD SHARES (OWNER)
    // =========================
    let shares = await Share.find({ username: userId })
      .populate("username", "firstname lastname username avatar friends")
      .populate({
        path: "post",
        populate: [
          {
            path: "author",
            select: "firstname lastname username avatar friends"
          },
          {
            path: "linkedItems",
            select: "title images type condition seller",
            populate: {
              path: "seller",
              select: "firstname lastname username avatar"
            }
          }
        ]
      })
      .lean();

    // 👉 FILTER HIDDEN SHARES (THEO VIEWER)
    if (viewer?.hiddenShares?.length) {
      shares = shares.filter(
        s => !viewer.hiddenShares.some(
          id => id.toString() === s._id.toString()
        )
      );
    }

    // 👉 FILTER AUDIENCE SHARE
    shares = shares.filter(share => canViewShare(share, viewerId));



    // =========================
    // 4. FORMAT DATA
    // =========================
    const formattedPosts = posts.map(p => ({
      ...p,
      type: "original"
    }));

    const formattedShares = shares.map(s => {
      const canViewOriginalPost = canViewPost(s.post, viewerId);

      // ❗ CHỈ COI LÀ DELETED KHI POST THẬT SỰ KHÔNG TỒN TẠI
      const isDeleted = !s.post;

      const originalPostMeta = isDeleted
        ? {
            deleted: true
          }
        : {
            author: s.post.author,
            createdAt: s.post.createdAt,
            audience: s.post.audience,
            deleted: false
          };

      return {
        ...s,
        type: "share",

        // content
        post: canViewOriginalPost ? s.post : null,

        // meta
        originalPostMeta,

        canViewPost: canViewOriginalPost,
        commentCount: s.commentCount || 0,
        replyCommentCount: s.replyCommentCount || 0
      };
    });




    // =========================
    // 5. STATS (KHÔNG PHỤ THUỘC PAGINATION)
    // =========================
    const totalPosts = formattedPosts.length + formattedShares.length;

    const totalPhotos = formattedPosts.filter(
      p => p.mediaType === "image"
    ).length;

    // =========================
    // 6. PAGINATION
    // =========================
    const allFeed = [...formattedPosts, ...formattedShares].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const totalItems = allFeed.length;
    const totalPages = Math.ceil(totalItems / limit);
    const items = allFeed.slice(skip, skip + limit);

    // =========================
    // 7. RESPONSE
    // =========================
    res.status(200).json({
      items,
      currentPage: page,
      totalPages,
      totalItems,
      stats: {
        totalPosts,   // post + share
        totalPhotos   // chỉ post có ảnh
      }
    });

  } catch (err) {
    console.error("User feed error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


const resolveMediaType = (post) => {
  if (!post.media) return null;

  if (post.mediaType === 'image') return 'image';
  if (post.mediaType === 'video') return 'video';

  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(post.media)) return 'image';
  if (/\.(mp4|webm|mov|ogg)$/i.test(post.media)) return 'video';

  return null;
};
// FeedController.js
exports.getUserMedia = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({
      author: userId,
      media: { $exists: true, $ne: "" }
    })
      .select("_id media mediaType createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const normalized = posts
      .map(p => {
        const resolvedType = (() => {
          if (p.mediaType === 'image') return 'image';
          if (p.mediaType === 'video') return 'video';
          if (/\.(jpg|jpeg|png|gif|webp)$/i.test(p.media)) return 'image';
          if (/\.(mp4|webm|mov|ogg)$/i.test(p.media)) return 'video';
          return null;
        })();

        return resolvedType
          ? { ...p, mediaType: resolvedType }
          : null;
      })
      .filter(Boolean);

    const photos = normalized.filter(p => p.mediaType === 'image');
    const videos = normalized.filter(p => p.mediaType === 'video');

    res.json({
      all: normalized,
      photos,
      videos,
      stats: {
        totalMedia: normalized.length,
        totalPhotos: photos.length,
        totalVideos: videos.length
      }
    });
  } catch (err) {
    console.error("Get user media error:", err);
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
        const isFriend = post.author.friends?.some(
          f => f.toString() === viewerId
        );


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
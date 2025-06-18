// ✅ GroupRoutes.js - Improved
const express = require('express');
const router = express.Router();
const GroupController = require('../controllers/GroupController');

// ✅ Optional: Add authentication middleware
// const auth = require('../middleware/auth');

// ===== GROUP MANAGEMENT =====
router.post('/create', GroupController.createGroup);
router.put('/update', GroupController.updateGroup);
router.delete('/delete', GroupController.deleteGroup);
router.get('/details/:groupId', GroupController.getGroupDetails);

// ===== MEMBER MANAGEMENT =====
router.post('/join', GroupController.requestToJoinGroup);
router.post('/approve-member', GroupController.approveMember);
router.delete('/remove-member', GroupController.removeMember);
router.post('/leave', GroupController.leaveGroup); // ✅ New route

// ===== POST MANAGEMENT =====
router.post('/post', GroupController.createGroupPost);
router.post('/approve-post', GroupController.approvePost);
router.post('/reject-post', GroupController.rejectPost);
router.delete('/delete-post', GroupController.deletePost);

// ===== GET DATA =====
router.get('/posts/:groupId', GroupController.getGroupPosts);
router.get('/pending-posts/:groupId', GroupController.getPendingPosts);

// ===== OPTIONAL: Additional useful routes =====

// Get all groups (with pagination and filters)
router.get('/all', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      visibility = 'all',
      search = '' 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    let query = { isActive: true };
    
    if (visibility !== 'all') {
      query.visibility = visibility;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const groups = await require('../models/GroupModel')
      .find(query)
      .populate('admin', 'firstname lastname username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await require('../models/GroupModel').countDocuments(query);

    res.status(200).json({
      groups,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalGroups: total,
        hasMore: skip + groups.length < total
      }
    });
  } catch (err) {
    console.error("Get all groups error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user's groups
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'all' } = req.query; // 'admin', 'member', 'all'

    if (!require('mongoose').Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }

    let query = { isActive: true };
    
    if (type === 'admin') {
      query.admin = userId;
    } else if (type === 'member') {
      query.members = userId;
    } else {
      query.$or = [
        { admin: userId },
        { members: userId }
      ];
    }

    const groups = await require('../models/GroupModel')
      .find(query)
      .populate('admin', 'firstname lastname username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      groups,
      counts: {
        adminGroups: groups.filter(g => g.admin._id.toString() === userId).length,
        memberGroups: groups.filter(g => g.members.includes(userId)).length
      }
    });
  } catch (err) {
    console.error("Get user groups error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Search groups
router.get('/search', async (req, res) => {
  try {
    const { q, visibility = 'public' } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ msg: 'Search query is required' });
    }

    const groups = await require('../models/GroupModel')
      .find({
        isActive: true,
        visibility: visibility,
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      })
      .populate('admin', 'firstname lastname username avatar')
      .sort({ memberCount: -1 })
      .limit(20);

    res.status(200).json({
      groups,
      count: groups.length,
      query: q
    });
  } catch (err) {
    console.error("Search groups error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get group statistics (admin only)
router.get('/stats/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id || req.query.userId;

    const group = await require('../models/GroupModel').findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // Only admin can see detailed stats
    if (group.admin.toString() !== userId) {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    // Get post statistics
    const postStats = await require('../models/PostModel').aggregate([
      { $match: { group: require('mongoose').Types.ObjectId(groupId) } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          approvedPosts: { $sum: { $cond: [{ $eq: ['$approved', true] }, 1, 0] } },
          pendingPosts: { $sum: { $cond: [{ $eq: ['$approved', false] }, 1, 0] } }
        }
      }
    ]);

    const stats = {
      members: {
        total: group.memberCount,
        pending: group.pendingMembers.length
      },
      posts: postStats[0] || {
        totalPosts: 0,
        approvedPosts: 0,
        pendingPosts: 0
      },
      group: {
        createdAt: group.createdAt,
        visibility: group.visibility,
        isActive: group.isActive
      }
    };

    res.status(200).json(stats);
  } catch (err) {
    console.error("Get group stats error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
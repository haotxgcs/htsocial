// ✅ GroupController.js - Improved
const Group = require('../models/GroupModel');
const Post = require('../models/PostModel');
const User = require('../models/UserModel');
const mongoose = require('mongoose');

// ✅ Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ✅ Helper function to check admin permission
const checkAdminPermission = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) return { error: 'Group not found', status: 404 };
  if (group.admin.toString() !== userId) {
    return { error: 'Access denied. Admin only.', status: 403 };
  }
  return { group };
};

exports.createGroup = async (req, res) => {
  try {
    const { name, description, visibility } = req.body;
    const adminId = req.user?.id || req.body.adminId; // Assuming auth middleware

    // ✅ Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ msg: 'Group name is required' });
    }

    if (!adminId || !isValidObjectId(adminId)) {
      return res.status(400).json({ msg: 'Valid admin ID is required' });
    }

    const group = new Group({
      name: name.trim(),
      description: description?.trim() || '',
      visibility: visibility || 'public',
      admin: adminId,
      members: [adminId],
      memberCount: 1
    });

    await group.save();
    
    // ✅ Populate admin info
    const populatedGroup = await Group.findById(group._id)
      .populate('admin', 'firstname lastname username avatar')
      .populate('members', 'firstname lastname username avatar');

    res.status(201).json({ 
      msg: 'Group created successfully', 
      group: populatedGroup 
    });
  } catch (err) {
    console.error("Create group error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: 'Validation error', errors: err.errors });
    }
    res.status(500).json({ msg: 'Failed to create group' });
  }
};

exports.requestToJoinGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    // ✅ Validation
    if (!isValidObjectId(groupId) || !isValidObjectId(userId)) {
      return res.status(400).json({ msg: 'Invalid group or user ID' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // ✅ Check if already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ msg: 'Already a member of this group' });
    }

    // ✅ Check if already requested
    if (group.pendingMembers.includes(userId)) {
      return res.status(400).json({ msg: 'Join request already sent' });
    }

    if (group.visibility === 'private') {
      group.pendingMembers.push(userId);
      await group.save();
      res.status(200).json({ msg: 'Join request sent and waiting for approval' });
    } else {
      group.members.push(userId);
      await group.save();
      res.status(200).json({ msg: 'Successfully joined the group' });
    }
  } catch (err) {
    console.error("Join request error:", err);
    res.status(500).json({ msg: 'Failed to process join request' });
  }
};

exports.approveMember = async (req, res) => {
  try {
    const { groupId, userId, adminId } = req.body;

    // ✅ Check admin permission
    const { group, error, status } = await checkAdminPermission(groupId, adminId);
    if (error) return res.status(status).json({ msg: error });

    // ✅ Check if user is in pending list
    if (!group.pendingMembers.includes(userId)) {
      return res.status(404).json({ msg: 'User not found in pending list' });
    }

    // ✅ Move from pending to members
    group.pendingMembers = group.pendingMembers.filter(id => id.toString() !== userId);
    group.members.push(userId);
    await group.save();

    res.status(200).json({ msg: 'Member approved successfully' });
  } catch (err) {
    console.error("Approve member error:", err);
    res.status(500).json({ msg: 'Failed to approve member' });
  }
};

exports.createGroupPost = async (req, res) => {
  try {
    const { groupId, content } = req.body;
    const userId = req.user?.id || req.body.userId; // Assuming auth middleware

    // ✅ Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ msg: 'Post content is required' });
    }

    if (!isValidObjectId(groupId) || !isValidObjectId(userId)) {
      return res.status(400).json({ msg: 'Invalid group or user ID' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    // ✅ Check membership
    if (!group.members.includes(userId)) {
      return res.status(403).json({ msg: "You must be a member to post in this group" });
    }

    // ✅ Create post
    const newPost = new Post({
      content: content.trim(),
      author: userId,
      group: groupId,
      approved: false
    });

    await newPost.save();

    // ✅ Auto-approve logic
    const isAdmin = group.admin.toString() === userId;
    const isPublicGroup = group.visibility === "public";
    
    if (isPublicGroup || isAdmin) {
      newPost.approved = true;
      await newPost.save();
      group.approvedPosts.push(newPost._id);
      group.postCount += 1;
    } else {
      group.pendingPosts.push(newPost._id);
    }

    await group.save();
    
    // ✅ Return populated post
    const populatedPost = await Post.findById(newPost._id)
      .populate('author', 'firstname lastname username avatar');
    
    res.status(201).json({ 
      msg: (isPublicGroup || isAdmin) 
        ? "Post created and published" 
        : "Post created and waiting for approval", 
      post: populatedPost,
      approved: newPost.approved
    });
  } catch (err) {
    console.error("Create group post error:", err);
    res.status(500).json({ msg: "Failed to create post" });
  }
};

exports.approvePost = async (req, res) => {
  try {
    const { groupId, postId, adminId } = req.body;

    // Check quyền admin
    const { group, error, status } = await checkAdminPermission(groupId, adminId);
    if (error) return res.status(status).json({ msg: error });

    // Tìm post trong pending
    const postIndex = group.pendingPosts.findIndex(id => id.toString() === postId);
    if (postIndex === -1) {
      return res.status(404).json({ msg: 'Pending post not found' });
    }

    // Cập nhật trạng thái approved của bài viết
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    post.approved = true;
    await post.save();

    // Chuyển post từ pending sang approved
    group.pendingPosts.splice(postIndex, 1);
    group.approvedPosts.push(postId);
    group.postCount += 1;
    await group.save();

    // Cập nhật postCount của user
    await User.findByIdAndUpdate(post.author, { $inc: { postCount: 1 } });

    res.status(200).json({ msg: 'Post approved successfully' });
  } catch (err) {
    console.error("Approve post error:", err);
    res.status(500).json({ msg: 'Failed to approve post' });
  }
};


exports.rejectPost = async (req, res) => {
  try {
    const { groupId, postId, adminId } = req.body;

    // ✅ Check admin permission
    const { group, error, status } = await checkAdminPermission(groupId, adminId);
    if (error) return res.status(status).json({ msg: error });

    // ✅ Remove from pendingPosts
    const postIndex = group.pendingPosts.findIndex(id => id.toString() === postId);
    if (postIndex === -1) {
      return res.status(404).json({ msg: 'Pending post not found' });
    }

    group.pendingPosts.splice(postIndex, 1);
    await group.save();

    // ✅ Delete post from database
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ msg: 'Post rejected and deleted' });
  } catch (err) {
    console.error("Reject post error:", err);
    res.status(500).json({ msg: 'Failed to reject post' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId, adminId } = req.body;

    // ✅ Check admin permission
    const { group, error, status } = await checkAdminPermission(groupId, adminId);
    if (error) return res.status(status).json({ msg: error });

    // ✅ Cannot remove admin
    if (group.admin.toString() === userId) {
      return res.status(400).json({ msg: 'Cannot remove group admin' });
    }

    // ✅ Check if user is member
    if (!group.members.includes(userId)) {
      return res.status(404).json({ msg: 'User is not a member of this group' });
    }

    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();

    res.status(200).json({ msg: 'Member removed successfully' });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ msg: 'Failed to remove member' });
  }
};

// ✅ FIXED: deletePost function with proper postCount handling
exports.deletePost = async (req, res) => {
  try {
    const { groupId, postId, userId } = req.body;

    // ✅ Validation
    if (!isValidObjectId(groupId) || !isValidObjectId(postId) || !isValidObjectId(userId)) {
      return res.status(400).json({ msg: 'Invalid group, post, or user ID' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // ✅ Check permissions (admin or author can delete)
    const isAdmin = group.admin.toString() === userId;
    const isAuthor = post.author.toString() === userId;
    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ msg: 'Access denied. Only admin or post author can delete.' });
    }

    // ✅ Store author ID for postCount update
    const authorId = post.author;
    const wasApproved = post.approved;

    // ✅ Remove post from group arrays
    group.approvedPosts = group.approvedPosts.filter(id => id.toString() !== postId);
    group.pendingPosts = group.pendingPosts.filter(id => id.toString() !== postId);

    // ✅ Update group postCount only if post was approved
    if (wasApproved) {
      group.postCount = Math.max(0, group.postCount - 1);
    }

    await group.save();
    
    // ✅ Delete post from database
    await Post.findByIdAndDelete(postId);

    // ✅ Update user's postCount only if post was approved
    if (wasApproved) {
      await User.findByIdAndUpdate(authorId, {
        $inc: { postCount: -1 }
      });
    }

    res.status(200).json({ 
      msg: 'Post deleted successfully',
      postWasApproved: wasApproved
    });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ msg: 'Failed to delete post' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId, adminId } = req.body;
    const { group, error, status } = await checkAdminPermission(groupId, adminId);
    if (error) return res.status(status).json({ msg: error });

    const posts = await Post.find({ group: groupId });
    for (const post of posts) {
      if (post.approved) {
        await User.findByIdAndUpdate(post.author, { $inc: { postCount: -1 } });
      }
    }

    await Post.deleteMany({ group: groupId });
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ msg: 'Group and all its posts deleted successfully' });
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ msg: 'Failed to delete group' });
  }
};

exports.getPendingPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id || req.query.userId;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ msg: 'Invalid group ID' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // ✅ Only admin can see pending posts
    if (group.admin.toString() !== userId) {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    const populatedGroup = await Group.findById(groupId).populate({
      path: 'pendingPosts',
      populate: { 
        path: 'author', 
        select: 'firstname lastname username avatar' 
      },
      options: { sort: { createdAt: -1 } }
    });

    res.status(200).json({
      posts: populatedGroup.pendingPosts,
      count: populatedGroup.pendingPosts.length
    });
  } catch (err) {
    console.error("Get pending posts error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ msg: 'Invalid group ID' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // ✅ Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const populatedGroup = await Group.findById(groupId).populate({
      path: 'approvedPosts',
      populate: { 
        path: 'author', 
        select: 'firstname lastname username avatar' 
      },
      options: { 
        sort: { createdAt: -1 },
        skip: skip,
        limit: parseInt(limit)
      }
    });

    res.status(200).json({
      posts: populatedGroup.approvedPosts,
      currentPage: parseInt(page),
      totalPosts: group.postCount,
      hasMore: skip + populatedGroup.approvedPosts.length < group.postCount
    });
  } catch (err) {
    console.error("Get group posts error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ msg: 'Invalid group ID' });
    }

    const group = await Group.findById(groupId)
      .populate('admin', 'firstname lastname username avatar')
      .populate('members', 'firstname lastname username avatar')
      .populate('pendingMembers', 'firstname lastname username avatar');

    if (!group) return res.status(404).json({ msg: 'Group not found' });

    res.status(200).json({
      group,
      stats: {
        memberCount: group.memberCount,
        pendingCount: group.pendingMembers.length,
        postCount: group.postCount
      }
    });
  } catch (err) {
    console.error("Get group details error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { groupId, name, description, visibility, adminId } = req.body;

    // ✅ Check admin permission
    const { group, error, status } = await checkAdminPermission(groupId, adminId);
    if (error) return res.status(status).json({ msg: error });

    // ✅ Update fields
    if (name && name.trim()) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (visibility && ['public', 'private'].includes(visibility)) {
      group.visibility = visibility;
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('admin', 'firstname lastname username avatar')
      .populate('members', 'firstname lastname username avatar');

    res.status(200).json({ 
      msg: 'Group updated successfully', 
      group: updatedGroup 
    });
  } catch (err) {
    console.error("Update group error:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ msg: 'Validation error', errors: err.errors });
    }
    res.status(500).json({ msg: 'Failed to update group' });
  }
};

// ✅ New function: Leave group
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // ✅ Admin cannot leave their own group
    if (group.admin.toString() === userId) {
      return res.status(400).json({ msg: 'Admin cannot leave the group. Transfer ownership first.' });
    }

    // ✅ Check if user is member
    if (!group.members.includes(userId)) {
      return res.status(400).json({ msg: 'You are not a member of this group' });
    }

    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();

    res.status(200).json({ msg: 'Successfully left the group' });
  } catch (err) {
    console.error("Leave group error:", err);
    res.status(500).json({ msg: 'Failed to leave group' });
  }
};
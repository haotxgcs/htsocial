// controllers/GroupController.js
const Group = require('../models/GroupModel');
const GroupPost = require('../models/GroupPostModel');
const User = require('../models/UserModel');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const checkAdminPermission = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) return { error: 'Group not found', status: 404 };
  if (group.admin.toString() !== userId) {
    return { error: 'Access denied. Admin only.', status: 403 };
  }
  return { group };
};

// ===== GROUP MANAGEMENT =====
exports.createGroup = async (req, res) => {
  try {
    const { name, description, adminId, visibility = 'public' } = req.body;
    if (!name || !adminId) return res.status(400).json({ msg: 'Name and adminId are required' });

    const newGroup = await Group.create({
      name,
      description,
      admin: adminId,
      members: [adminId],
      visibility,
      memberCount: 1
    });

    res.status(201).json({ msg: 'Group created successfully', group: newGroup });
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { groupId, adminId, name, description, visibility } = req.body;
    const { group, error, status } = await checkAdminPermission(groupId, adminId);
    if (error) return res.status(status).json({ msg: error });

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (visibility) group.visibility = visibility;

    await group.save();
    res.status(200).json({ msg: 'Group updated successfully', group });
  } catch (err) {
    console.error("Update group error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId, adminId } = req.body;
    const { group, error, status } = await checkAdminPermission(groupId, adminId);
    if (error) return res.status(status).json({ msg: error });

    await Group.findByIdAndDelete(groupId);
    await GroupPost.deleteMany({ group: groupId });

    res.status(200).json({ msg: 'Group deleted successfully' });
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate('admin', 'firstname lastname username avatar')
      .populate('members', 'username avatar')
      .populate('approvedPosts')
      .populate('pendingMembers', 'username avatar');

    if (!group) return res.status(404).json({ msg: 'Group not found' });
    res.status(200).json(group);
  } catch (err) {
    console.error("Get group details error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ===== MEMBER MANAGEMENT =====
exports.requestToJoinGroup = async (req, res) => {
  const { groupId, userId } = req.body;
  if (!isValidObjectId(groupId) || !isValidObjectId(userId)) {
    return res.status(400).json({ msg: 'Invalid IDs' });
  }

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ msg: 'Group not found' });

  if (group.members.includes(userId)) {
    return res.status(400).json({ msg: 'Already a member' });
  }

  if (group.visibility === 'private') {
    if (group.pendingMembers.includes(userId)) {
      return res.status(400).json({ msg: 'Already requested to join' });
    }
    group.pendingMembers.push(userId);
    await group.save();
    return res.status(200).json({ msg: 'Requested to join, waiting for approval' });
  } else {
    group.members.push(userId);
    group.memberCount++;
    await group.save();
    return res.status(200).json({ msg: 'Joined public group' });
  }
};

exports.approveMember = async (req, res) => {
  const { groupId, userId, adminId } = req.body;
  const { group, error, status } = await checkAdminPermission(groupId, adminId);
  if (error) return res.status(status).json({ msg: error });

  if (!group.pendingMembers.includes(userId)) {
    return res.status(404).json({ msg: 'User not in pending list' });
  }

  group.pendingMembers = group.pendingMembers.filter(id => id.toString() !== userId);
  group.members.push(userId);
  group.memberCount++;
  await group.save();

  res.status(200).json({ msg: 'Member approved successfully' });
};

exports.removeMember = async (req, res) => {
  const { groupId, userId, adminId } = req.body;
  const { group, error, status } = await checkAdminPermission(groupId, adminId);
  if (error) return res.status(status).json({ msg: error });

  if (!group.members.includes(userId)) {
    return res.status(404).json({ msg: 'User not in group' });
  }

  if (group.admin.toString() === userId) {
    return res.status(400).json({ msg: 'Cannot remove admin' });
  }

  group.members = group.members.filter(id => id.toString() !== userId);
  group.memberCount = Math.max(0, group.memberCount - 1);
  await group.save();

  res.status(200).json({ msg: 'Member removed' });
};

exports.leaveGroup = async (req, res) => {
  const { groupId, userId } = req.body;
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ msg: 'Group not found' });

  if (!group.members.includes(userId)) {
    return res.status(400).json({ msg: 'You are not a member of this group' });
  }

  if (group.admin.toString() === userId) {
    return res.status(400).json({ msg: 'Admin cannot leave. Transfer ownership first.' });
  }

  group.members = group.members.filter(id => id.toString() !== userId);
  group.memberCount = Math.max(0, group.memberCount - 1);
  await group.save();

  res.status(200).json({ msg: 'Left group successfully' });
};

// ===== POST MANAGEMENT =====
exports.createGroupPost = async (req, res) => {
  const { groupId, content } = req.body;
  const userId = req.user?.id || req.body.userId;

  if (!content || !isValidObjectId(groupId) || !isValidObjectId(userId)) {
    return res.status(400).json({ msg: 'Invalid input' });
  }

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ msg: 'Group not found' });

  if (!group.members.includes(userId)) {
    return res.status(403).json({ msg: 'You are not a member' });
  }

  const newPost = new GroupPost({
    content,
    group: groupId,
    author: userId,
    approved: false
  });

  const isAdmin = group.admin.toString() === userId;
  const isPublic = group.visibility === 'public';

  if (isAdmin || isPublic) {
    newPost.approved = true;
    group.approvedPosts.push(newPost._id);
    group.postCount++;
    await User.findByIdAndUpdate(userId, { $inc: { postCount: 1 } });
  } else {
    group.pendingPosts.push(newPost._id);
  }

  await newPost.save();
  await group.save();

  res.status(201).json({
    msg: newPost.approved ? 'Post published' : 'Post pending approval',
    post: newPost
  });
};

exports.approvePost = async (req, res) => {
  const { groupId, postId, adminId } = req.body;
  const { group, error, status } = await checkAdminPermission(groupId, adminId);
  if (error) return res.status(status).json({ msg: error });

  if (!group.pendingPosts.includes(postId)) {
    return res.status(404).json({ msg: 'Post not pending' });
  }

  await GroupPost.findByIdAndUpdate(postId, { approved: true });
  group.pendingPosts = group.pendingPosts.filter(id => id.toString() !== postId);
  group.approvedPosts.push(postId);
  group.postCount++;

  const post = await GroupPost.findById(postId);
  if (post) {
    await User.findByIdAndUpdate(post.author, { $inc: { postCount: 1 } });
  }

  await group.save();
  res.status(200).json({ msg: 'Post approved' });
};

exports.rejectPost = async (req, res) => {
  const { groupId, postId, adminId } = req.body;
  const { group, error, status } = await checkAdminPermission(groupId, adminId);
  if (error) return res.status(status).json({ msg: error });

  if (!group.pendingPosts.includes(postId)) {
    return res.status(404).json({ msg: 'Post not in pending list' });
  }

  group.pendingPosts = group.pendingPosts.filter(id => id.toString() !== postId);
  await GroupPost.findByIdAndDelete(postId);
  await group.save();

  res.status(200).json({ msg: 'Post rejected and deleted' });
};

exports.deletePost = async (req, res) => {
  const { groupId, postId, userId } = req.body;
  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ msg: 'Group not found' });

  const post = await GroupPost.findById(postId);
  if (!post) return res.status(404).json({ msg: 'Post not found' });

  const isAdmin = group.admin.toString() === userId;
  const isAuthor = post.author.toString() === userId;

  if (!isAdmin && !isAuthor) {
    return res.status(403).json({ msg: 'No permission to delete' });
  }

  if (post.approved) {
    group.approvedPosts = group.approvedPosts.filter(id => id.toString() !== postId);
    group.postCount = Math.max(0, group.postCount - 1);
    await User.findByIdAndUpdate(post.author, { $inc: { postCount: -1 } });
  } else {
    group.pendingPosts = group.pendingPosts.filter(id => id.toString() !== postId);
  }

  await GroupPost.findByIdAndDelete(postId);
  await group.save();

  res.status(200).json({ msg: 'Post deleted' });
};

exports.getGroupPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const posts = await GroupPost.find({ group: groupId, approved: true })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    console.error("Get group posts error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getPendingPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const posts = await GroupPost.find({ group: groupId, approved: false })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    console.error("Get pending posts error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

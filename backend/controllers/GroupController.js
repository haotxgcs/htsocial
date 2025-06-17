// ✅ GroupController.js
const Group = require('../models/GroupModel');
const Post = require('../models/PostModel');
const User = require('../models/UserModel');

exports.createGroup = async (req, res) => {
  try {
    const { name, description, visibility, adminId } = req.body;

    const group = new Group({
      name,
      description,
      visibility,
      admin: adminId,
      members: [adminId],
      avatar: 'uploads/group.png', // Default avatar
    });

    await group.save();
    res.status(201).json({ msg: 'Group created', group });
  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ msg: 'Failed to create group' });
  }
};

exports.requestToJoinGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    if (group.visibility === 'private') {
      group.pendingMembers.push(userId);
      await group.save();
      res.status(200).json({ msg: 'Join request sent' });
    } else {
      group.members.push(userId);
      await group.save();
      res.status(200).json({ msg: 'Joined group' });
    }
  } catch (err) {
    console.error("Join request error:", err);
    res.status(500).json({ msg: 'Failed to join group' });
  }
};

exports.approveMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    group.pendingMembers = group.pendingMembers.filter(id => id.toString() !== userId);
    group.members.push(userId);
    await group.save();

    res.status(200).json({ msg: 'Member approved' });
  } catch (err) {
    console.error("Approve member error:", err);
    res.status(500).json({ msg: 'Failed to approve member' });
  }
};

// Tạo bài đăng trong nhóm
exports.createGroupPost = async (req, res) => {
  const { groupId, userId, content } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const post = {
      content,
      author: userId,
      approved: group.visibility === "public"
    };

    group.posts.push(post);
    await group.save();
    res.status(201).json({ msg: "Post created", post });
  } catch (err) {
    res.status(500).json({ msg: "Failed to post" });
  }
};

exports.approvePost = async (req, res) => {
  try {
    const { groupId, postId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    group.pendingPosts = group.pendingPosts.filter(id => id.toString() !== postId);
    group.posts.push(postId);
    await group.save();

    res.status(200).json({ msg: 'Post approved' });
  } catch (err) {
    console.error("Approve post error:", err);
    res.status(500).json({ msg: 'Failed to approve post' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();
    res.status(200).json({ msg: 'Member removed' });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ msg: 'Failed to remove member' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { groupId, postId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    group.posts = group.posts.filter(id => id.toString() !== postId);
    await group.save();
    res.status(200).json({ msg: 'Post deleted from group' });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ msg: 'Failed to delete post' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    await Group.findByIdAndDelete(groupId);
    res.status(200).json({ msg: 'Group deleted' });
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ msg: 'Failed to delete group' });
  }
};

exports.getPendingPosts = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate({
      path: 'pendingPosts',
      populate: { path: 'author', select: 'firstname lastname username avatar' }
    });

    if (!group) return res.status(404).json({ msg: 'Group not found' });
    res.status(200).json(group.pendingPosts);
  } catch (err) {
    console.error("Get pending posts error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('members', 'firstname lastname username avatar');

    if (!group) return res.status(404).json({ msg: 'Group not found' });
    res.status(200).json(group);
  } catch (err) {
    console.error("Get group details error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateGroup = async (req, res) => {
    try {
        const { groupId, name, description, visibility } = req.body;
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ msg: 'Group not found' });
        group.name = name || group.name;
        group.description = description || group.description;
        group.visibility = visibility || group.visibility;
        await group.save();
        res.status(200).json({ msg: 'Group updated', group });
    } catch (err) {
        console.error("Update group error:", err);
        res.status(500).json({ msg: 'Failed to update group' });
    }   
}
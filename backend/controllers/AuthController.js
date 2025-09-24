// controllers/AuthController.js

const User = require("../models/UserModel");
const Post = require("../models/PostModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ===== 1. Đăng ký (Register) =====
exports.register = async (req, res) => {
  const { username, email, password, firstname, lastname, role = "user" } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const avatar = `uploads/${role === "admin" ? "admin.png" : "user.png"}`;

    const newUser = new User({
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      avatar,
      coverPhoto: "uploads/cover.png",
      bio: "",
      role,
      friends: [],
      likedPosts: [],
      active: false,
      requestSent: [],
      requestReceived: []
    });

    await newUser.save();

    // Gửi email xác minh
    const verificationLink = `http://localhost:8080/verify/${newUser._id}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "htsocial1st@gmail.com",
        pass: "njvb btnp cfek wfmu"
      }
    });

    await transporter.sendMail({
      from: '"HT Social" <htsocial1st@gmail.com>',
      to: email,
      subject: "Account Verification",
      html: `<p>Click the link to verify your account:</p><a href="${verificationLink}">${verificationLink}</a>`
    });

    res.status(201).json({ msg: "User registered. Verification email sent.", userId: newUser._id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ===== Update User Profile: coverPhoto & bio =====
exports.updateProfile = async (req, res) => {
  const { bio } = req.body;
  const userId = req.user?.id || req.params.id;

  try {
    let updateData = { bio };
    if (req.file) updateData.coverPhoto = req.file.path;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true
    }).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });
    res.status(200).json({ msg: "Cập nhật hồ sơ thành công", user });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ===== 2. Xác minh tài khoản =====
exports.verifyByLink = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isVerified) return res.status(400).json({ msg: "Already verified" });

    user.isVerified = true;
    await user.save();

    res.status(200).json({ msg: "Account verified successfully" });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ===== 3. Đăng nhập =====
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "1h" });

    user.active = true;
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        role: user.role,
        friends: user.friends,
        likedPosts: user.likedPosts,
        active: user.active,
        requestSent: user.requestSent,
        requestReceived: user.requestReceived
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ===== 4. Đăng xuất =====
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.active = false;
    await user.save();

    res.status(200).json({ msg: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 5. Lấy danh sách tất cả user (Get All Users) =====
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "firstname lastname username email avatar role createdAt updatedAt");

    const usersWithPostCount = await Promise.all(
      users.map(async (user) => {
        const postCount = await Post.countDocuments({ author: user._id });
        return {
          ...user.toObject(),
          postCount
        };
      })
    );

    res.status(200).json(usersWithPostCount);
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 6. Lấy user theo ID (Get User By ID) =====
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id,
      "firstname lastname username email avatar role createdAt updatedAt active requestSent requestReceived"
    );
    if (!user) return res.status(404).json({ msg: "User not found" });

    const postCount = await Post.countDocuments({ author: user._id });

    res.status(200).json({
      ...user.toObject(),
      postCount
    });
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ===== 7. Cập nhật user (Update User) =====
exports.updateUser = async (req, res) => {
  const { firstname, lastname, username, email, avatar, role, bio, coverPhoto, gender, location } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstname,
        lastname,
        username,
        email,
        avatar,
        role,
        bio,
        coverPhoto,
        gender,
        location
      },
      { new: true, runValidators: true, fields: "-password" }
    );

    if (!updatedUser) return res.status(404).json({ msg: "User not found" });

    res.status(200).json({
      msg: "User updated",
      user: updatedUser
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 8. Xóa user (Delete User) =====
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ msg: "User not found" });

    res.status(200).json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 9. Gửi lời mời kết bạn (Send Friend Request) =====
exports.sendFriendRequest = async (req, res) => {
  const { fromUserId, toUserId } = req.body;

  if (fromUserId === toUserId)
    return res.status(400).json({ msg: "Không thể gửi lời mời cho chính mình" });

  try {
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);
    if (!fromUser || !toUser)
      return res.status(404).json({ msg: "Người dùng không tồn tại" });

    if (fromUser.requestSent.includes(toUserId))
      return res.status(400).json({ msg: "Đã gửi lời mời" });

    fromUser.requestSent.push(toUserId);
    toUser.requestReceived.push(fromUserId);

    await fromUser.save();
    await toUser.save();

    res.status(200).json({ msg: "Đã gửi lời mời kết bạn" });
  } catch (err) {
    console.error("Send friend request error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 10. Chấp nhận lời mời kết bạn (Accept Friend Request) =====
exports.acceptFriendRequest = async (req, res) => {
  const { userId, requesterId } = req.body;

  try {
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);
    if (!user || !requester)
      return res.status(404).json({ msg: "Người dùng không tồn tại" });

    // Xoá khỏi requestReceived / requestSent
    user.requestReceived = user.requestReceived.filter(id => id.toString() !== requesterId);
    requester.requestSent = requester.requestSent.filter(id => id.toString() !== userId);

    // Thêm vào danh sách friends (hai chiều)
    user.friends.push(requesterId);
    requester.friends.push(userId);

    await user.save();
    await requester.save();

    res.status(200).json({ msg: "Đã chấp nhận lời mời" });
  } catch (err) {
    console.error("Accept friend request error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 11. Huỷ lời mời kết bạn (Cancel Friend Request) =====
exports.cancelFriendRequest = async (req, res) => {
  const { fromUserId, toUserId } = req.body;

  try {
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);
    if (!fromUser || !toUser)
      return res.status(404).json({ msg: "Người dùng không tồn tại" });

    fromUser.requestSent = fromUser.requestSent.filter(id => id.toString() !== toUserId);
    toUser.requestReceived = toUser.requestReceived.filter(id => id.toString() !== fromUserId);

    await fromUser.save();
    await toUser.save();

    res.status(200).json({ msg: "Đã huỷ lời mời kết bạn" });
  } catch (err) {
    console.error("Cancel friend request error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 12. Huỷ kết bạn (Unfriend) =====
exports.unFriend = async (req, res) => {
  const { userId, friendId } = req.body;

  if (userId === friendId)
    return res.status(400).json({ msg: "You cannot unfriend yourself" });

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend)
      return res.status(404).json({ msg: "User or friend not found" });

    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId);

    await user.save();
    await friend.save();

    res.status(200).json({ msg: "Unfriended successfully" });
  } catch (err) {
    console.error("Unfriend error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 13. Cập nhật trạng thái online (Set Active Status) =====
exports.setActiveStatus = async (req, res) => {
  const { userId, active } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { active },
      { new: true }
    );
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json({ msg: "Cập nhật trạng thái thành công", active: user.active });
  } catch (err) {
    console.error("Set active status error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Lấy danh sách bạn bè của user
exports.getFriends = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId).populate("friends", "firstname lastname username avatar active");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.status(200).json(user.friends);
  } catch (err) {
    console.error("Get friends error:", err);
    res.status(500).json({ msg: "Server error" });
  }
}
// controllers/AuthController.js

const User = require("../models/UserModel");
const { notify } = require("./NotificationController");
const Post = require("../models/PostModel");
const { getFriendStatus } = require("../services/userFriendLogic");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs');
const {
  sendVerifyAccount,
  sendEmailChangeOtp,
  sendEmailChangedSuccess,
  sendPasswordChangeOtp,
  sendPasswordChangedSuccess,
  sendPasswordResetOtp,
  sendPasswordResetSuccess,
} = require("../services/emailService");

// Hàm helper: Chọn ảnh mặc định dựa trên Giới tính & Role
const getGenderDefaultAvatar = (gender, role) => {
  if (role === 'admin') return 'uploads/admin_avatar.png';

  const g = gender ? gender.toLowerCase() : '';
  if (g === 'male' || g === 'nam') return 'uploads/male_avatar.png';
  if (g === 'female' || g === 'nữ') return 'uploads/female_avatar.png';
  
  return 'uploads/generic_avatar.png';
};


// ===== 1. Đăng ký (Register) =====
exports.register = async (req, res) => {
  const {
    username,
    email,
    password,
    firstname,
    lastname,
    gender,
    birthday,
    location,
    bio,
    role = "user"
  } = req.body;

  try {
    // ✅ 1. Validation cơ bản
    if (!username || !email || !password) {
      return res.status(400).json({
        msg: "Username, email and password are required"
      });
    }

    if (!firstname || !lastname) {
      return res.status(400).json({
        msg: "Firstname and lastname are required"
      });
    }

    // ✅ 2. Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    // ✅ 3. Password strength
    if (password.length < 6) {
      return res.status(400).json({
        msg: "Password must be at least 6 characters"
      });
    }

    // ✅ 4. Check user tồn tại
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        msg: "Username or email already exists"
      });
    }

    // ✅ 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ 6. Avatar mặc định theo gender + role (dùng helper)
    const avatar = getGenderDefaultAvatar(gender, role);

    // ✅ 7. Tạo user mới đầy đủ thông tin
    const newUser = new User({
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,

      gender,
      birthday: birthday || null,
      location: location || "",
      bio: bio || "",

      avatar,
      coverPhoto: "uploads/cover.png",

      role,
      isVerified: false,
      active: false
    });

    await newUser.save();

    // ✅ 8. Gửi email verify
    const verificationLink = `http://localhost:8080/verify/${newUser._id}`;
    await sendVerifyAccount({
      to: email,
      firstname,
      lastname,
      verificationLink,
    });


    // ✅ 9. Response chuẩn
    res.status(201).json({
      msg: "User registered successfully. Verification email sent.",
      userId: newUser._id
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      msg: "Server error",
      error: err.message
    });
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
  // identifier có thể là username hoặc email
  const { identifier, password } = req.body;

  try {
    // ✅ 1. Validate input
    if (!identifier || !password) {
      return res.status(400).json({
        msg: "Please provide username/email and password"
      });
    }

    // ✅ 2. Tìm user theo username OR email
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (user.banned) {
      return res.status(403).json({ msg: "Your account has been banned." });
    }

    // ✅ 3. Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // ✅ 4. Optional: Check verified account
    if (!user.isVerified) {
      return res.status(403).json({
        msg: "Please verify your email before logging in"
      });
    }

    // ✅ 5. Generate JWT token
    const token = jwt.sign(
      { id: user._id, v: user.token_version || 0 },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    // ✅ 6. Set active status
    user.active = true;
    await user.save();

    // ✅ 7. Return full user info (giữ nguyên format của bạn)
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
        requestReceived: user.requestReceived,
        darkTheme: user.darkTheme,
        createdAt: user.createdAt,        // ← THÊM
        gender: user.gender,              // ← THÊM
        birthday: user.birthday,          // ← THÊM
        location: user.location, 
        last_password_change: user.last_password_change, // ← THÊM
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




exports.getAllUsers = async (req, res) => {
  try {
    const viewerId = req.query.viewerId;
    const viewer = viewerId ? await User.findById(viewerId) : null;

    const users = await User.find(
      {},
      "firstname lastname username email avatar role createdAt updatedAt friends requestSent requestReceived"
    );

    const usersWithPostCount = await Promise.all(
      users.map(async (user) => {
        const postCount = await Post.countDocuments({ author: user._id });

        return {
          ...user.toObject(),
          postCount,
          friendStatus: viewer ? getFriendStatus(viewer, user) : "none"
        };
      })
    );

    res.status(200).json(usersWithPostCount);
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};





exports.getUserById = async (req, res) => {
  try {
    const viewerId = req.query.viewerId;

    const user = await User.findById(
      req.params.id,
      "firstname lastname username email avatar coverPhoto role bio birthday location gender friends requestSent requestReceived createdAt updatedAt active banned"
    );

    if (!user) return res.status(404).json({ msg: "User not found" });

    const postCount = await Post.countDocuments({ author: user._id });

    let friendStatus = "none";

    if (viewerId) {
      const viewer = await User.findById(viewerId);
      if (viewer) {
        friendStatus = getFriendStatus(viewer, user);
      }
    }

    res.status(200).json({
      ...user.toObject(),
      postCount,
      friendStatus
    });
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};



const checkChangeLimit = (lastChangeDate, daysLimit = 30) => {
  if (!lastChangeDate) return { allowed: true };

  const now = new Date();
  const lastChange = new Date(lastChangeDate);
  
  // Calculate the unlock date (last change + 30 days)
  const nextAllowedDate = new Date(lastChange);
  nextAllowedDate.setDate(lastChange.getDate() + daysLimit);

  // Check if current time is past the allowed date
  const isAllowed = now >= nextAllowedDate;

  // Format: "HH:mm, DD/MM/YYYY" (e.g., "14:30, 25/12/2025")
  const formattedDate = nextAllowedDate.toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false // Use 24h format
  }).replace(',', ''); // Adjust format if needed

  return { allowed: isAllowed, formattedDate: formattedDate };
};

// ===== 7. Update User (Enhanced Security & Specific Time) =====
exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const { 
    firstname, lastname, username, email, 
    avatar,coverPhoto, bio, gender, location, birthday 
  } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const now = new Date();

    if (coverPhoto !== undefined) {
      // Trường hợp xóa ảnh bìa (gửi lên chuỗi rỗng)
      if (coverPhoto === "") {
        // Xóa file cũ trên ổ cứng (nếu không phải mặc định)
        if (user.coverPhoto) {
          deleteOldImage(user.coverPhoto);
        }
        // Gán về ảnh mặc định
        user.coverPhoto = "uploads/cover.png";
      } else {
        // Trường hợp đổi ảnh mới (đã upload xong và gửi đường dẫn lên)
        user.coverPhoto = coverPhoto;
      }
    }

    // ---------------------------------------------------------
    // A. SECURITY CHECK: FIRSTNAME / LASTNAME (30 Days)
    // ---------------------------------------------------------
    if ((firstname && firstname !== user.firstname) || (lastname && lastname !== user.lastname)) {
      const check = checkChangeLimit(user.last_name_change);

      if (!check.allowed) {
        return res.status(403).json({ 
          msg: `You cannot change your name right now. Please wait until ${check.formattedDate}.` 
        });
      }

      // If allowed, apply changes
      if (firstname) user.firstname = firstname;
      if (lastname) user.lastname = lastname;
      user.last_name_change = now;
    }

    // ---------------------------------------------------------
    // B. SECURITY CHECK: USERNAME (30 Days) - NEW
    // ---------------------------------------------------------
    if (username && username !== user.username) {
      // Check if username is already taken by another user
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ msg: "Username is already taken." });
      }

      const check = checkChangeLimit(user.last_username_change);

      if (!check.allowed) {
        return res.status(403).json({ 
          msg: `You cannot change your username right now. Please wait until ${check.formattedDate}.` 
        });
      }

      // If allowed, apply changes
      user.username = username;
      user.last_username_change = now;
    }

    // ---------------------------------------------------------
    // C. UPDATE PUBLIC INFO (No Restrictions)
    // ---------------------------------------------------------
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (birthday !== undefined) user.birthday = birthday;

    if (avatar !== undefined) {
      // Trường hợp 1: User muốn xóa ảnh (gửi lên chuỗi rỗng)
      if (avatar === "") {
        // Xóa ảnh cũ trên ổ cứng (nếu không phải ảnh mặc định)
        if (user.avatar) {
          deleteOldImage(user.avatar);
        }
        
        // QUAN TRỌNG: Tính toán lại ảnh mặc định dựa trên giới tính hiện tại
        // (Lưu ý: nếu request này có gửi kèm gender mới thì dùng gender mới, không thì dùng user.gender cũ)
        const currentGender = (gender !== undefined) ? gender : user.gender;
        const currentRole = user.role;
        
        user.avatar = getGenderDefaultAvatar(currentGender, currentRole);
        
      } else {
        // Trường hợp 2: User đổi sang ảnh khác (thường là đường dẫn mới upload)
        user.avatar = avatar;
      }
    }

    // Cập nhật các thông tin khác (giữ nguyên)
    if (gender !== undefined) {
       user.gender = gender;
       // Nếu user đổi giới tính mà đang dùng ảnh mặc định -> Cũng cần đổi ảnh theo
       const isUsingDefault = user.avatar.includes('avatar.png') || user.avatar.includes('user.png');
       if (isUsingDefault && avatar === undefined) { 
          // Chỉ đổi ảnh nếu user không đang upload ảnh mới cùng lúc
          user.avatar = getGenderDefaultAvatar(gender, user.role);
       }
    }

    if (email && email !== user.email) user.email = email; // Note: Should use OTP for email

    // Save all changes
    await user.save();

    // Return updated user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      msg: "User profile updated successfully",
      user: userResponse
    });

  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
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

// ===== 9. Request Email Change (Send OTP) =====
exports.requestEmailChange = async (req, res) => {
  const { userId, newEmail } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // --- [START] MISSING VALIDATION LOGIC ---
    
    // 1. Check empty
    if (!newEmail) {
      return res.status(400).json({ msg: "Please provide a new email address." });
    }

    // 2. Check format (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ msg: "Invalid email format." });
    }

    // 3. Check same email
    if (newEmail === user.email) {
      return res.status(400).json({ msg: "New email cannot be the same as your current email." });
    }
    // --- [END] VALIDATION LOGIC ---

    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) return res.status(400).json({ msg: "Email is already taken" });

    // --- Rate Limit Check (5 Minutes) ---
    if (user.last_otp_sent_at) {
      const diffMinutes = (Date.now() - new Date(user.last_otp_sent_at)) / (1000 * 60);
      if (diffMinutes < 5) {
        const waitTime = Math.ceil(5 - diffMinutes);
        return res.status(429).json({ msg: `Please wait ${waitTime} minute(s) before requesting a new OTP.` });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.email_otp = otp;
    user.email_otp_expire = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.last_otp_sent_at = Date.now();
    await user.save();

    await sendEmailChangeOtp({
      to: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      newEmail,
      otp,
    });

    res.status(200).json({ msg: `OTP sent to your current email: ${user.email}. Please check your inbox.` });
  } catch (err) {
    console.error("Request email change error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ===== 10. Verify and Change Email (Link to Login) =====
exports.verifyAndChangeEmail = async (req, res) => {
  const { userId, otp, newEmail } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 1. Kiểm tra OTP
    if (String(user.email_otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ msg: "Invalid OTP code" });
    }
    
    // 2. Kiểm tra thời hạn
    if (Date.now() > user.email_otp_expire) {
      return res.status(400).json({ msg: "OTP has expired" });
    }

    // 3. Cập nhật Email mới
    user.email = newEmail;
    user.email_otp = null;
    user.email_otp_expire = null;
    await user.save();

    // 4. Gửi Email Thông Báo Thành Công
    sendEmailChangedSuccess({
      to: newEmail,
      firstname: user.firstname,
      lastname: user.lastname,
      newEmail,
    }).catch(err => console.error("Send success email error:", err));

    // 5. Trả về kết quả
    const updatedUser = user.toObject();
    delete updatedUser.password;
    delete updatedUser.email_otp;

    res.status(200).json({ 
      msg: "Email changed successfully. A confirmation email has been sent.", 
      user: updatedUser 
    });

  } catch (err) {
    console.error("Verify email change error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ===== 11. Yêu cầu Đổi Mật khẩu (Gửi OTP) =====
exports.requestPasswordChange = async (req, res) => {
  const { userId } = req.body; // Hoặc dùng email nếu là tính năng "Quên mật khẩu"

  try {
    // 1. Tìm user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 2. Kiểm tra Rate Limit (5 phút)
    if (user.last_password_otp_sent_at) {
      const diffMinutes = (Date.now() - new Date(user.last_password_otp_sent_at)) / (1000 * 60);
      if (diffMinutes < 5) {
        const waitTime = Math.ceil(5 - diffMinutes);
        return res.status(429).json({ msg: `Please wait ${waitTime} minute(s) before requesting new OTP.` });
      }
    }

    // 3. Tạo OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.password_otp = otp;
    user.password_otp_expire = Date.now() + 5 * 60 * 1000; // 5 phút
    user.last_password_otp_sent_at = Date.now();
    await user.save();

    // 4. Gửi Email OTP
    await sendPasswordChangeOtp({
      to: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      otp,
    });

    res.status(200).json({ msg: `OTP sent to ${user.email}` });

  } catch (err) {
    console.error("Request password change error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ===== 12. Xác thực OTP và Đổi Mật khẩu =====
exports.verifyAndChangePassword = async (req, res) => {
  const { userId, otp, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 1. Kiểm tra OTP
    // Chuyển về chuỗi và xóa khoảng trắng để so sánh chính xác
    if (String(user.password_otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ msg: "Invalid OTP code" });
    }
    
    // Kiểm tra thời hạn OTP
    if (Date.now() > user.password_otp_expire) {
      return res.status(400).json({ msg: "OTP has expired" });
    }

    // --- [START] NEW VALIDATION LOGIC ---
    
    // 2. Kiểm tra độ dài mật khẩu (Ví dụ: 6 - 50 ký tự)
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters long." });
    }
    if (newPassword.length > 50) {
      return res.status(400).json({ msg: "Password is too long (max 50 characters)." });
    }

    // 3. Kiểm tra trùng mật khẩu cũ
    // Dùng bcrypt.compare để so sánh mật khẩu mới (chưa hash) với mật khẩu cũ (đã hash trong DB)
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({ msg: "New password cannot be the same as your current password." });
    }
    // --- [END] NEW VALIDATION LOGIC ---

    // 4. Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.last_password_change = Date.now();

    // 5. Dọn dẹp OTP & Logout các thiết bị khác
    user.password_otp = null;
    user.password_otp_expire = null;
    
    // Tăng phiên đăng nhập (token_version) để vô hiệu hóa token cũ trên các máy khác
    user.token_version = (user.token_version || 0) + 1; 
    
    // (Tùy chọn) Set trạng thái offline
    user.active = false;

    await user.save();

    // 6. Gửi Email Thông Báo Thành Công
    sendPasswordChangedSuccess({
      to: user.email,
      firstname: user.firstname,
    }).catch(err => console.error("Send password success email error:", err));

    res.status(200).json({ msg: "Password changed successfully! All other devices have been logged out." });

  } catch (err) {
    console.error("Verify password change error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.requestResetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email })
      .select("email firstname lastname avatar gender password_otp password_otp_expire last_password_otp_sent_at");
    if (!user) return res.status(404).json({ msg: "User not found" });
    // Rate limit: 5 phút
    if (user.last_password_otp_sent_at) {
      const diffMinutes = (Date.now() - new Date(user.last_password_otp_sent_at)) / (1000 * 60);
      if (diffMinutes < 5) {
        const waitTime = Math.ceil(5 - diffMinutes);
        return res.status(429).json({ msg: `Please wait ${waitTime} minute(s) before requesting new OTP.` });
      }
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.password_otp = otp;
    user.password_otp_expire = Date.now() + 5 * 60 * 1000;
    user.last_password_otp_sent_at = Date.now();
    await user.save();
    await sendPasswordResetOtp({
      to: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      otp,
    });
    res.status(200).json({ 
      msg: `OTP sent to ${user.email}`,
        user: {
          firstname: user.firstname,
          lastname: user.lastname,
          avatar: user.avatar,
        } 
    });
  } catch (err) {
    console.error("Request password reset error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.verifyAndResetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ msg: "User not found" });
    if (String(user.password_otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ msg: "Invalid OTP code" });
    }
    if (Date.now() > user.password_otp_expire) {
      return res.status(400).json({ msg: "OTP has expired" });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters long." });
    }
    if (newPassword.length > 50) {
      return res.status(400).json({ msg: "Password is too long (max 50 characters)." });
    }
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({ msg: "New password cannot be the same as your current password." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password            = await bcrypt.hash(newPassword, salt);
    user.last_password_change = Date.now();
    user.password_otp        = null;
    user.password_otp_expire = null;
    user.token_version       = (user.token_version || 0) + 1;
    user.active              = false;
    await user.save();

    // ── Gửi email thông báo reset thành công ──────────────────
    sendPasswordResetSuccess({
      to: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
    }).catch(err => console.error("Send password reset email error:", err));
    // ─────────────────────────────────────────────────────────

    res.status(200).json({ msg: "Password reset successfully! Please log in with your new password." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 13. Gửi lời mời kết bạn (Send Friend Request) =====
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

    // Notify recipient
    await notify({
      recipientId: toUserId,
      senderId:    fromUserId,
      type:        "friend_request"
    }).catch(() => {});

    res.status(200).json({ msg: "Đã gửi lời mời kết bạn" });
  } catch (err) {
    console.error("Send friend request error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 14. Chấp nhận lời mời kết bạn (Accept Friend Request) =====
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

    // Notify requester their request was accepted
    await notify({
      recipientId: requesterId,
      senderId:    userId,
      type:        "friend_accepted"
    }).catch(() => {});

    res.status(200).json({ msg: "Đã chấp nhận lời mời" });
  } catch (err) {
    console.error("Accept friend request error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// ===== 15. Huỷ lời mời kết bạn (Cancel Friend Request) =====
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


// ===== 16. Huỷ kết bạn (Unfriend) =====
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

exports.checkFriendStatus = async (req, res) => {
  try {
    const { id, viewerId } = req.params;

    if (!id || !viewerId) {
      return res.status(400).json({ isFriend: false });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ isFriend: false });

    const isFriend = user.friends.includes(viewerId);
    res.json({ isFriend });

  } catch (err) {
    console.error("Check friend status error:", err);
    res.status(500).json({ isFriend: false });
  }
};



// ===== 17. Cập nhật trạng thái online (Set Active Status) =====
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

// 18. Lấy danh sách bạn bè của user (CÓ PHÂN TRANG)
exports.getFriends = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 1. Lấy tham số phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 2. Tìm user để đếm tổng số bạn bè (cho việc tính totalPages)
    const userCount = await User.findById(userId);
    if (!userCount) return res.status(404).json({ msg: "User not found" });
    
    const totalItems = userCount.friends.length;
    const totalPages = Math.ceil(totalItems / limit);

    // 3. Query lấy danh sách bạn bè theo trang (Dùng populate options)
    const user = await User.findById(userId)
      .populate({
        path: "friends",
        select: "firstname lastname username avatar active",
        options: {
          skip: skip,
          limit: limit
        }
      });

    // 4. Trả về cấu trúc chuẩn cho Frontend
    res.status(200).json({
      items: user.friends, // Chỉ chứa 6 người (nếu limit=6)
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems
    });

  } catch (err) {
    console.error("Get friends error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ===== 19. Ẩn bài viết (Hide Post) =====
exports.hidePost = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.hiddenPosts.includes(req.params.postId)) {
      user.hiddenPosts.push(req.params.postId);
      await user.save();
    }

    res.status(200).json({ message: 'Post hidden successfully' });
  } catch (err) {
    console.error("Hide post error:", err);
    res.status(500).json({ message: 'Error hiding post' });
  }
};

// Hàm phụ: Xóa file cũ trên disk
const deleteOldImage = (filePath) => {
  if (!filePath) return;

  // 1. DANH SÁCH CÁC FILE MẶC ĐỊNH KHÔNG ĐƯỢC XÓA
  const protectedFiles = [
    'cover.png',
    'admin_avatar.png',
    'male_avatar.png',    // Mới thêm
    'female_avatar.png',  // Mới thêm
    'generic_avatar.png'  // Mới thêm
  ];

  // 2. Kiểm tra: Nếu tên file nằm trong danh sách bảo vệ -> Dừng lại (return)
  // Dùng .some() để kiểm tra xem filePath có chứa bất kỳ từ khóa nào trong mảng trên không
  const isProtected = protectedFiles.some(protectedFile => filePath.includes(protectedFile));

  if (isProtected) {
    // console.log("Bỏ qua xóa ảnh mặc định:", filePath); // Bật log nếu muốn debug
    return;
  }

  // 3. Thực hiện xóa file
  const fullPath = path.join(__dirname, '../', filePath); 
  
  fs.unlink(fullPath, (err) => {
    // Bỏ qua lỗi ENOENT (File không tồn tại - có thể do đã bị xóa trước đó)
    if (err && err.code !== 'ENOENT') { 
      console.error("Lỗi xóa ảnh cũ:", err.message);
    } else {
      // console.log("Đã xóa ảnh cũ:", filePath);
    }
  });
};


// Helper: extract Cloudinary public_id từ URL để xóa ảnh cũ
const extractCloudinaryPublicId = (url) => {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    // Lấy phần sau "/upload/", bỏ version (vXXX/) nếu có, bỏ extension
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    let path = parts[1];
    // Bỏ version prefix như v1234567890/
    path = path.replace(/^v\d+\//, "");
    // Bỏ extension
    path = path.replace(/\.[^.]+$/, "");
    return path;
  } catch {
    return null;
  }
};

// ==========================================
// [MỚI] 20. Upload Avatar
// ==========================================
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ msg: 'Please select an image file' });
    }

    // multer-storage-cloudinary trả về URL qua req.file.path
    const newAvatarUrl = req.file.path;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Xóa avatar cũ trên Cloudinary — parse public_id từ URL cũ
    const oldPublicId = extractCloudinaryPublicId(user.avatar);
    if (oldPublicId) {
      const cloudinary = require("../services/cloudinary");
      await cloudinary.uploader.destroy(oldPublicId).catch(() => {});
    }

    user.avatar = newAvatarUrl;
    await user.save();

    res.status(200).json(user);
  } catch (err) {
    console.error("Upload avatar error:", err);
    res.status(500).json({ msg: 'Server error during avatar upload' });
  }
};

// ==========================================
// [MỚI] 21. Upload Ảnh Bìa (Cover Photo)
// ==========================================
exports.uploadCover = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ msg: 'Please select an image file' });
    }

    const newCoverUrl = req.file.path;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Xóa cover cũ trên Cloudinary — parse public_id từ URL cũ
    const oldPublicId = extractCloudinaryPublicId(user.coverPhoto);
    if (oldPublicId) {
      const cloudinary = require("../services/cloudinary");
      await cloudinary.uploader.destroy(oldPublicId).catch(() => {});
    }

    user.coverPhoto = newCoverUrl;
    await user.save();

    res.status(200).json(user);
  } catch (err) {
    console.error("Upload cover error:", err);
    res.status(500).json({ msg: 'Server error during cover upload' });
  }
};

// 1. Lấy lịch sử tìm kiếm
exports.getSearchHistory = async (req, res) => {
  try {
    const { context } = req.query; // 🔥
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const history = context
      ? user.searchHistory
          .filter(h => h.context === context)
          .slice(0, 10)
      : [];

    res.status(200).json({ history });
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ error: err.message });
  }
};


// 2. Lưu từ khóa mới
exports.saveSearchHistory = async (req, res) => {
  try {
    const { query, context } = req.body;
    const userId = req.params.id;

    if (!query || !context) {
      return res.status(400).json({ msg: "Query and context are required" });
    }

    // Bước 1: Xóa từ khóa cũ nếu trùng (để đưa lên đầu)
    await User.findByIdAndUpdate(userId, {
       $pull: {
        searchHistory: { query, context }
      }
    });

    // Bước 2: Chèn lên đầu và giới hạn 10 item
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          searchHistory: {
            $each: [{ query, context }],
            $position: 0,
            $slice: 50 // Chỉ giữ 10 cái mới nhất
          }
        }
      },
      { new: true }
    );

    res.json({
      history: updatedUser.searchHistory.filter(
        h => h.context === context
      )
    });
  } catch (err) {
    console.error("Save history error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 3. Xóa một từ khóa cụ thể
exports.removeSearchHistoryItem = async (req, res) => {
  try {
    const { query, context } = req.body; // ✅ Thêm context
    const userId = req.params.id;

    if (!query || !context) {
      return res.status(400).json({ msg: "Query and context are required" });
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { searchHistory: { query, context } }
    });

    res.status(200).json({ msg: "Removed from history" });
  } catch (err) {
    console.error("Remove item error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 4. Xóa toàn bộ lịch sử
exports.clearSearchHistory = async (req, res) => {
  try {
    const userId = req.params.id;
    const { context } = req.body; // 🔥 marketplace | home

    if (!context) {
      return res.status(400).json({ msg: "Context is required" });
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { searchHistory: { context } }
    });

    res.status(200).json({ msg: "History cleared" });
  } catch (err) {
    console.error("Clear history error:", err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /users/preference — lưu darkTheme
exports.updatePreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { darkTheme } = req.body;

    await User.findByIdAndUpdate(userId, { darkTheme });

    // Cập nhật lại localStorage phía client sẽ tự xử lý
    res.json({ success: true, darkTheme });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
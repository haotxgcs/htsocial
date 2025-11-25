// controllers/AuthController.js

const User = require("../models/UserModel");
const Post = require("../models/PostModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Load from .env
      pass: process.env.EMAIL_PASS  // Load from .env
    }
  });
};

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
      requestReceived: [],
      savedPosts: []
    });

    await newUser.save();

    // Gửi email xác minh
    const verificationLink = `http://localhost:8080/verify/${newUser._id}`;

    const transporter = nodemailer.createTransport();

    await transporter.sendMail({
      from: '"HT Social" <' + process.env.EMAIL_USER + '>',
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

    const token = jwt.sign({ id: user._id , v: user.token_version || 0 }, process.env.JWT_SECRET || "default_secret", { expiresIn: "1h" });

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
      "firstname lastname username email avatar role bio birthday location gender friends createdAt updatedAt active requestSent requestReceived last_name_change last_username_change"
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
    avatar, bio, gender, location, birthday 
  } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const now = new Date();

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
    if (gender !== undefined) user.gender = gender;
    if (location !== undefined) user.location = location;
    if (birthday !== undefined) user.birthday = birthday;
    if (avatar !== undefined) user.avatar = avatar;
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

    const transporter = createTransporter();
    const brandColor = "#ff5757"; 

    await transporter.sendMail({
          from: '"HT Social Security" <' + process.env.EMAIL_USER + '>',
          to: user.email,
          subject: "Verification Code for Email Change",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
              @import url('https://fonts.googleapis.com/css2?family=Berkshire+Swash&display=swap');
              </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
              
              <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                
                <div style="background-color: ${brandColor}; padding: 30px 20px; text-align: center;">
                  <h1 style="
                    color: #ffffff; 
                    margin: 0; 
                    font-size: 36px; 
                    font-weight: 400; 
                    font-family: 'Berkshire Swash', cursive, serif;
                  ">
                    HT Social
                  </h1>
                </div>
        
                <div style="padding: 40px 30px; color: #333333;">
                  <h2 style="margin-top: 0; color: #333; font-size: 20px; font-weight: 600;">Confirm your email change</h2>
                  
                  <p style="font-size: 16px; line-height: 1.6; color: #555;">
                    Hello <b>${user.firstname} ${user.lastname}</b>,
                    <br><br>
                    We received a request to change the email address associated with your account to:
                    <a href="mailto:${newEmail}" style="color: ${brandColor}; text-decoration: none; font-weight: bold;">${newEmail}</a>
                  </p>
        
                  <p style="font-size: 16px; line-height: 1.6; color: #555;">
                    Please use the verification code below to confirm this change.
                  </p>
        
                  <div style="margin: 30px 0; text-align: center;">
                    <span style="
                      display: inline-block;
                      font-size: 32px;
                      font-weight: bold;
                      letter-spacing: 5px;
                      color: ${brandColor};
                      background-color: #fff0f1;
                      border: 2px dashed ${brandColor};
                      padding: 15px 40px;
                      border-radius: 8px;
                    ">
                      ${otp}
                    </span>
                  </div>
        
                  <p style="font-size: 14px; color: #777; text-align: center;">
                    This code will expire in <b>5 minutes</b>.
                  </p>
        
                  <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
                    <p style="font-size: 14px; color: #999; line-height: 1.5;">
                      <strong>Security Notice:</strong> If you did not request this change, please ignore this email.
                    </p>
                  </div>
                </div>
        
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888;">
                  <p style="margin: 0;">&copy; ${new Date().getFullYear()} HT Social. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `
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
    const transporter = createTransporter();
    const brandColor = "#ff5757"; 

    // --- CẤU HÌNH LINK LOGIN ---
    // Thay đổi port 8080 thành port frontend thực tế của bạn nếu khác
    const loginLink = "http://localhost:8080/login"; 

    transporter.sendMail({
      from: '"HT Social Security" <' + process.env.EMAIL_USER + '>',
      to: newEmail,
      subject: "Email Changed Successfully",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=berkshire+swash&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <div style="background-color: ${brandColor}; padding: 30px 20px; text-align: center;">
              <h1 style="
                color: #ffffff; 
                margin: 0; 
                font-size: 32px; 
                font-weight: 700; 
                letter-spacing: 1px;
                font-family: 'Berkshire Swash', cursive, serif;
              ">
                HT Social
              </h1>
            </div>
    
            <div style="padding: 40px 30px; color: #333;">
              
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #ff5757; margin: 0; font-size: 24px;">Email Updated</h2>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Hello <b>${user.firstname} ${user.lastname}</b>,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Your <b>HT Social</b> account email has been successfully changed to:
              </p>
              
              <div style="margin: 25px 0; text-align: center;">
                <span style="
                  display: inline-block;
                  font-size: 18px;
                  font-weight: bold;
                  color: ${brandColor};
                  background-color: #fff0f1;
                  padding: 12px 24px;
                  border-radius: 50px;
                  text-decoration: none;
                ">
                  ${newEmail}
                </span>
              </div>

              <p style="font-size: 15px; color: #555; text-align: center;">
                Please use this email address to 
                <a href="${loginLink}" style="color: ${brandColor}; text-decoration: none; font-weight: bold;">log in</a> 
                from now on.
              </p>
              
              <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
                <p style="font-size: 13px; color: #999; line-height: 1.5; text-align: center;">
                  If you did not make this change, please contact our support team immediately.
                </p>
              </div>
            </div>

            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} HT Social. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
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

    // 4. Gửi Email OTP (Template đẹp)
    const transporter = createTransporter();
    const brandColor = "#ff5757";

    await transporter.sendMail({
      from: '"HT Social Security" <' + process.env.EMAIL_USER + '>',
      to: user.email,
      subject: "Verification Code for Password Change",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <style>
              @import url('https://fonts.googleapis.com/css2?family=berkshire+swash&display=swap');
        </style>
        <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <div style="background-color: ${brandColor}; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; font-family: 'Berkshire Swash', cursive, serif; letter-spacing: 1px;">HT Social</h1>
            </div>
            <div style="padding: 40px 30px; color: #333;">
              <h2 style="margin-top: 0; font-size: 20px;">Request to Change Password</h2>
              <p>Hello <b>${user.firstname}</b>,</p>
              <p>We received a request to reset or change your password.</p>
              <p>Please use the code below to proceed:</p>
              
              <div style="margin: 30px 0; text-align: center;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: ${brandColor}; background-color: #fff0f1; border: 2px dashed ${brandColor}; padding: 15px 40px; border-radius: 8px;">
                  ${otp}
                </span>
              </div>
              
              <p style="font-size: 14px; color: #777; text-align: center;">This code expires in <b>5 minutes</b>.</p>
              <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
                <p style="font-size: 14px; color: #999;"><strong>Security Notice:</strong> If you did not request this, someone may be trying to access your account. Do not share this code.</p>
              </div>
            </div>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #888; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} HT Social. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
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

    // 5. Dọn dẹp OTP & Logout các thiết bị khác
    user.password_otp = null;
    user.password_otp_expire = null;
    
    // Tăng phiên đăng nhập (token_version) để vô hiệu hóa token cũ trên các máy khác
    user.token_version = (user.token_version || 0) + 1; 
    
    // (Tùy chọn) Set trạng thái offline
    user.active = false;

    await user.save();

    // 6. Gửi Email Thông Báo Thành Công
    const transporter = createTransporter();
    const brandColor = "#ff5757";
    // Đảm bảo port này đúng với frontend của bạn (8080 hoặc 3000)
    const loginLink = "http://localhost:8080/login"; 

    // Sử dụng .catch để lỗi gửi mail không làm crash luồng chính
    transporter.sendMail({
      from: '"HT Social Security" <' + process.env.EMAIL_USER + '>',
      to: user.email,
      subject: "Password Changed Successfully",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <style>
              @import url('https://fonts.googleapis.com/css2?family=berkshire+swash&display=swap');
        </style>
        <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <div style="background-color: ${brandColor}; padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; font-family: 'Berkshire Swash', cursive, serif; letter-spacing: 1px;">HT Social</h1>
            </div>
            <div style="padding: 40px 30px; color: #333;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #ff5757; margin: 0; font-size: 24px;">Password Updated!</h2>
              </div>
              <p>Hello <b>${user.firstname}</b>,</p>
              <p>Your password has been successfully changed. You can now log in with your new password.</p>
              
              <div style="margin: 30px 0; text-align: center;">
                 <a href="${loginLink}" style="background-color: ${brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                   Login Now
                 </a>
              </div>

              <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
                <p style="font-size: 13px; color: #999; text-align: center;">If you did not make this change, please contact support immediately.</p>
              </div>
            </div>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #888; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} HT Social. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }).catch(err => console.error("Send password success email error:", err));

    res.status(200).json({ msg: "Password changed successfully! All other devices have been logged out." });

  } catch (err) {
    console.error("Verify password change error:", err);
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

// 18. Lấy danh sách bạn bè của user
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


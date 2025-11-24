const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, default: "" },
    lastname: { type: String, default: "" },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Thống kê bài viết
    postCount: { type: Number, default: 0 },

    // Mối quan hệ
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    // Avatar và ảnh bìa
    avatar: { type: String }, // set mặc định bằng pre-save hook
    coverPhoto: { type: String, default: "uploads/cover.png" },

    // Profile cá nhân
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    birthday: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },

    // Trạng thái và quyền
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: false },

    // Lời mời kết bạn
    requestSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    requestReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Hidden posts and shares
    hiddenPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    hiddenShares: [{ type: mongoose.Schema.Types.ObjectId, ref: "Share" }],

    // Saved posts
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],

    last_name_change: { type: Date, default: null },
    last_username_change: { type: Date, default: null },

    email_otp: { type: String, default: null },
    email_otp_expire: { type: Date, default: null },
    last_otp_sent_at: { type: Date, default: null },

    password_otp: { type: String, default: null },
    password_otp_expire: { type: Date, default: null },
    last_password_otp_sent_at: { type: Date, default: null },

    token_version: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ✅ Hook để đặt avatar mặc định theo role nếu chưa có
userSchema.pre("save", function (next) {
  if (!this.avatar) {
    this.avatar = this.role === "admin" ? "uploads/admin.png" : "uploads/user.png";
  }
  next();
});

module.exports = mongoose.model("User", userSchema);

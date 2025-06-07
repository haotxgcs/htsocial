const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, default: "" },
    lastname: { type: String, default: "" },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    postCount: { type: Number, default: 0 },

    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    avatar: { type: String, default: "uploads/user.png" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },

    active: { type: Boolean, default: false },
    requestSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    requestReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "User"}] 
  },
  
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("User", userSchema);

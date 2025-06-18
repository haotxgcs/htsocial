// ✅ models/GroupPostModel.js - FIXED VERSION
const mongoose = require('mongoose');

const groupPostSchema = new mongoose.Schema({
  content: { 
    type: String, 
    required: true,
    maxlength: 5000
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  group: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group', 
    required: true 
  },
  
  // Approval system for private groups
  approved: { 
    type: Boolean, 
    default: false 
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedAt: { 
    type: Date 
  },
  
  // Media attachments
  images: [{
    url: String,
    filename: String,
    size: Number
  }],
  videos: [{
    url: String,
    filename: String,
    size: Number,
    duration: Number
  }],
  files: [{
    url: String,
    filename: String,
    originalName: String,
    size: Number,
    mimeType: String
  }],
  
  // Group-specific features
  pinned: { 
    type: Boolean, 
    default: false 
  },
  announcement: { 
    type: Boolean, 
    default: false 
  },
  
  // Engagement
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  comments: [{
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    likes: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }]
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // For editing history
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
  
}, { timestamps: true });

// ==================== INDEXES ====================
groupPostSchema.index({ group: 1, approved: 1, createdAt: -1 });
groupPostSchema.index({ group: 1, pinned: -1, createdAt: -1 });
groupPostSchema.index({ author: 1, group: 1 });
groupPostSchema.index({ group: 1, announcement: 1, approved: 1 });
groupPostSchema.index({ approved: false, group: 1 }); // For pending posts

// ==================== VIRTUAL FIELDS ====================
groupPostSchema.virtual('totalLikes').get(function() {
  return this.likes.length;
});

groupPostSchema.virtual('totalComments').get(function() {
  return this.comments.length;
});

// ==================== INSTANCE METHODS ====================
groupPostSchema.methods.isLikedBy = function(userId) {
  return this.likes.includes(userId);
};

groupPostSchema.methods.canEdit = function(userId, groupAdmin) {
  return this.author.toString() === userId.toString() || groupAdmin.toString() === userId.toString();
};

groupPostSchema.methods.canDelete = function(userId, groupAdmin) {
  return this.author.toString() === userId.toString() || groupAdmin.toString() === userId.toString();
};

// ==================== STATIC METHODS ====================
groupPostSchema.statics.getGroupPosts = function(groupId, options = {}) {
  const { page = 1, limit = 10, includeAnnouncements = true } = options;
  
  let query = { 
    group: groupId, 
    approved: true, 
    isActive: true 
  };
  
  return this.find(query)
    .populate('author', 'firstname lastname username avatar')
    .populate('approvedBy', 'firstname lastname username')
    .populate('comments.author', 'firstname lastname username avatar')
    .sort({ 
      pinned: -1, 
      announcement: includeAnnouncements ? -1 : 1,
      createdAt: -1 
    })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

groupPostSchema.statics.getPendingPosts = function(groupId) {
  return this.find({ 
    group: groupId, 
    approved: false, 
    isActive: true 
  })
  .populate('author', 'firstname lastname username avatar')
  .sort({ createdAt: -1 });
};

groupPostSchema.statics.getUserGroupPosts = function(userId, groupId) {
  return this.find({ 
    author: userId, 
    group: groupId, 
    isActive: true 
  })
  .populate('group', 'name')
  .sort({ createdAt: -1 });
};

// ==================== MIDDLEWARE ====================
// FIXED: Pre-save middleware with correct logic
groupPostSchema.pre('save', function(next) {
  // Handle approval timestamp
  if (this.isModified('approved') && this.approved && !this.approvedAt) {
    this.approvedAt = new Date();
  } else if (this.isModified('approved') && !this.approved) {
    this.approvedAt = null;
  }
  
  // Handle edit timestamp - FIXED LOGIC
  if (this.isModified('edited') && this.edited) {
    this.editedAt = new Date();
  }
  
  next();
});

// ✅ FIXED: Added missing module export
module.exports = mongoose.model('GroupPost', groupPostSchema);
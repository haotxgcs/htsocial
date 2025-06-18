// ✅ GroupModel.js - Improved
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: { 
    type: String, 
    default: '',
    maxlength: 500
  },
  visibility: { 
    type: String, 
    enum: ['public', 'private'], 
    default: 'public' 
  },
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  avatar: { 
    type: String, 
    default: 'uploads/group.png' 
  },

  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  pendingMembers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],

  // ✅ Removed embedded posts - Posts will be stored separately
  // posts: [...] - Removed for better data structure
  
  pendingPosts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post' 
  }],
  
  // ✅ Added approved posts reference
  approvedPosts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post' 
  }],

  // ✅ Added useful fields
  isActive: {
    type: Boolean,
    default: true
  },
  
  memberCount: {
    type: Number,
    default: 0
  },
  
  postCount: {
    type: Number,
    default: 0
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Index for better performance
groupSchema.index({ name: 1 });
groupSchema.index({ admin: 1 });
groupSchema.index({ visibility: 1 });
groupSchema.index({ members: 1 });

// ✅ Virtual for total member count including pending
groupSchema.virtual('totalPendingCount').get(function() {
  return this.pendingMembers.length;
});

// ✅ Pre-save middleware to update member count
groupSchema.pre('save', function(next) {
  this.memberCount = this.members.length;
  next();
});

module.exports = mongoose.model('Group', groupSchema);
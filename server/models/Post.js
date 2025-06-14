var mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  User: {
    type: String,
    ref: 'user',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  likes: [{
    type: String,
    ref: 'user'
  }],
  comments: [{
    user: {
      type: String,
      ref: 'user',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
postSchema.index({ createdAt: -1 });
// postSchema.index({ user: 1 });
postSchema.index({ 'comments.user': 1 });

const Post = mongoose.model('Post', postSchema);

module.exports = Post; 
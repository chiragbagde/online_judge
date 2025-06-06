const mongoose = require('mongoose');
const { v4: uuidv4 } = require("uuid");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String, 
    default: uuidv4
  },
  tags: [{
    type: String,
    trim: true
  }],
  featuredImage: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  excerpt: {
    type: String,
    maxlength: 200
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  likes: [{
    type: String,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: String,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

blogSchema.virtual('url').get(function() {
  return `/blogs/${this.slug}`;
});

blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

const titleToSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

blogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = titleToSlug(this.title);
  }
  
  if (this.isModified('content') && !this.excerpt) {
    this.excerpt = this.content.substring(0, 200);
  }
  
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;

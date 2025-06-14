const express = require('express');
const Blog = require('../models/Blog.js');
const verifyToken = require('../verifyToken.js');
const mongoose = require('mongoose');
const logger = require('../services/logger.js');
const isAuthorOrAdmin = require('../middleware/isAuthor.js');
const cache = require('../middleware/cache.js');

const router = express.Router();

router.get('/trending', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const trendingArticles = await Blog.aggregate([
      { $match: { isPublished: true } },
      { $addFields: {
          score: {
            $add: [
              { $size: { $ifNull: ["$likes", []] } },
              { $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                1000 * 60 * 60 * 24
              ] }
            ]
          }
      }},
      { $sort: { score: -1 } },
      { $limit: parseInt(limit) },
      { $project: {
          title: 1,
          slug: 1,
          excerpt: 1,
          featuredImage: 1,
          views: { $size: { $ifNull: ["$views", []] } },
          likes: { $size: { $ifNull: ["$likes", []] } },
          comments: { $size: { $ifNull: ["$comments", []] } },
          publishedAt: 1,
          author: 1,
          tags: 1
      }}
    ]);

    res.json({ success: true, data: trendingArticles });
  } catch (error) {
    console.error('Error fetching trending articles:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/popular-tags', async (req, res) => {
  try {
    const { limit = 15 } = req.query;
    
    const publishedBlogsCount = await Blog.countDocuments({ isPublished: true });
    
    if (publishedBlogsCount === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'No published blogs found' 
      });
    }
    
    // Check if any published blogs have tags
    const blogWithTags = await Blog.findOne({ 
      isPublished: true, 
      tags: { $exists: true, $not: { $size: 0 } } 
    });
    
    if (!blogWithTags) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'No tags found in published blogs' 
      });
    }
    
    const tags = await Blog.aggregate([
      { $match: { isPublished: true, tags: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      { $project: { _id: 0, name: '$_id', count: 1 } }
    ]);

    res.status(200).json({ success: true, data: tags });
  } catch (error) {
    console.error('Error in /popular-tags:', {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching popular tags',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Blog.distinct('tags');
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
});

const handleError = (res, error, message = 'Something went wrong') => {
  console.error(error);
  return res.status(500).json({ success: false, message });
};

router.get('/', verifyToken, cache(() => "blogs"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { tag, search, author } = req.query;

    // Build query
    const query = { isPublished: true };
    
    if (tag) {
      query.tags = tag;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (author) {
      query.author = mongoose.Types.ObjectId(author);
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name email avatar')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email')
      .lean();
      
    const total = await Blog.countDocuments({ isPublished: true });
    
    res.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, tags, featuredImage, isPublished, id } = req.body;
    
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
    
    const blog = new Blog({
      title,
      content,
      author: id,
      tags: tags || [],
      featuredImage: featuredImage || '',
      isPublished: isPublished || false,
      slug,
      publishedAt: isPublished ? new Date() : null
    });
    
    await blog.save();
    
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages });
    }
    logger.error("Error creating blog:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/id', verifyToken, isAuthorOrAdmin, async (req, res) => {
  try {
    const { title, content, featuredImage, tags, isPublished, id } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and content are required' 
      });
    }

    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog post not found' 
      });
    }

    blog.title = title;
    blog.content = content;
    blog.featuredImage = featuredImage || blog.featuredImage;
    blog.tags = Array.isArray(tags) ? tags : [];

    console.log("Updating blog post:", blog);

    if (isPublished && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    
    blog.isPublished = isPublished || false;
    blog.updatedAt = new Date();

    await blog.save();

    return res.json({ 
      success: true, 
      message: 'Blog post updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update blog post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.delete('/id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    if (blog.author.toString() !== id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await blog.remove();
    
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    const comment = {
      user: req.user._id, // Use the authenticated user's ID
      content: req.body.content
    };
    
    blog.comments.unshift(comment);
    await blog.save();
    
    // Populate the user field in the newly added comment
    await blog.populate('comments.user', 'name email').execPopulate();
    
    // Get the newly added comment (first in the array since we used unshift)
    const newComment = blog.comments[0];
    
    res.status(201).json({ 
      success: true, 
      data: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/:id/like', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    const userId = req.user._id.toString();
    const likeIndex = blog.likes.findIndex(id => id.toString() === userId);
    
    if (likeIndex === -1) {
      blog.likes.push(userId);
    } else {
      blog.likes.splice(likeIndex, 1);
    }
    
    await blog.save();
    
    res.json({ 
      success: true, 
      data: { 
        likes: blog.likes.length,
        isLiked: blog.likes.includes(userId)
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    console.log(req.params.slug, "sluf");
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true })
      
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }
    
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)

    if (!blog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blog post not found' 
      });
    }

    if (!blog.isPublished && 
        (!req.user || (blog.author && blog.author._id.toString() !== req.user._id.toString()))) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this post'
      });
    }

    if (!req.user || (blog.author && blog.author._id.toString() !== req.user._id.toString())) {
      blog.views = (blog.views || 0) + 1;
      await blog.save();
    }

    res.json({ 
      success: true, 
      data: blog 
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid blog post ID' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;

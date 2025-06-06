const express = require('express');
const router = express.Router();
const { verifyToken } = require('../verifyToken');
const {
  addComment,
  getComments,
  deleteComment,
  updateComment
} = require('../services/blogServices/commentService');

const {
  toggleLike,
  checkIfLiked,
  getLikesCount
} = require('../services/blogServices/likeService');

// @desc    Add a comment to a blog post
// @route   POST /api/blogs/:id/comments
// @access  Private
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    const { id: blogId } = req.params;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment content is required' 
      });
    }

    const result = await addComment(blogId, userId, content);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @desc    Get all comments for a blog post
// @route   GET /api/blogs/:id/comments
// @access  Public
router.get('/:id/comments', async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const result = await getComments(blogId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @desc    Delete a comment
// @route   DELETE /api/blogs/:blogId/comments/:commentId
// @access  Private
router.delete('/:blogId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const result = await deleteComment(blogId, commentId, userId, isAdmin);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @desc    Update a comment
// @route   PUT /api/blogs/:blogId/comments/:commentId
// @access  Private
router.put('/:blogId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment content is required' 
      });
    }

    const result = await updateComment(blogId, commentId, userId, content);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @desc    Toggle like on a blog post
// @route   POST /api/blogs/:id/like
// @access  Private
router.post('/:id/like', verifyToken, async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const userId = req.user.id;

    const result = await toggleLike(blogId, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @desc    Check if user liked a blog post
// @route   GET /api/blogs/:id/like/status
// @access  Private
router.get('/:id/like/status', verifyToken, async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const userId = req.user.id;

    const result = await checkIfLiked(blogId, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @desc    Get likes count for a blog post
// @route   GET /api/blogs/:id/likes/count
// @access  Public
router.get('/:id/likes/count', async (req, res) => {
  try {
    const { id: blogId } = req.params;

    const result = await getLikesCount(blogId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting likes count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;

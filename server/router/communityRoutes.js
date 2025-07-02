const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const { check, validationResult } = require('express-validator');
const verifyToken = require('../verifyToken');

// @route   GET /api/community/posts
// @desc    Get all posts with pagination, supports following and popular filters
// @access  Private
router.get('/posts', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'recent'; // recent, following, popular
    

    let query = {};
    let sort = { createdAt: -1 };

    if (filter === 'following') {
      // Get list of users being followed
      const following = await Follow.find({ follower: req.user.id })
        .select('following');
      const followingIds = following.map(f => f.following);
      
      // Add current user's posts
      followingIds.push(req.user.id);
      
      query.User = { $in: followingIds };
    } else if (filter === 'popular') {
      // Sort by likes count and recency
      sort = { likes: -1, createdAt: -1 };
    }

    // Get posts with populated user data
    const posts = await Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('User', 'username')
      .populate('comments.user', 'username');

    // Get total count for pagination
    const total = await Post.countDocuments(query);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/community/posts
// @desc    Create a new post
// @access  Private
router.post('/posts', [
  verifyToken,
  check('content', 'Content is required').not().isEmpty(),
  check('content', 'Content must be between 1 and 1000 characters').isLength({ min: 1, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const post = new Post({
      User: req.user.id,
      content
    });

    await post.save();
    await post.populate('User', 'username'); 

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/community/posts/:id/like
// @desc    Like/Unlike a post
// @access  Private
router.post('/posts/:id/like', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user.id);
    if (likeIndex === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    await post.populate('User', 'username');
    await post.populate('comments.user', 'username');

    res.json(post);
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/community/posts/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/posts/:id/comments', [
  verifyToken,
  check('text', 'Comment text is required').not().isEmpty(),
  check('text', 'Comment must be between 1 and 500 characters').isLength({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const { text } = req.body;
    post.comments.push({
      user: req.user.id,
      text
    });

    await post.save();
    await post.populate('User', 'username');
    await post.populate('comments.user', 'username');

    // Return the newly added comment
    const newComment = post.comments[post.comments.length - 1];
    res.json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/community/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/posts/:id', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.User.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    await post.remove();
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error('Error deleting post:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/community/posts/:postId/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/posts/:postId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find(
      comment => comment._id.toString() === req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove comment
    post.comments = post.comments.filter(
      comment => comment._id.toString() !== req.params.commentId
    );

    await post.save();
    res.json({ message: 'Comment removed' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post or comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/community/follow/status/:userId
// @desc    Check if current user is following another user
// @access  Private

router.get('/follow/status/:userId', verifyToken, async (req, res) => {
  try {
    const follow = await Follow.findOne({
      follower: req.user.id,
      following: req.params.userId
    });

    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/community/follow
// @desc    Follow or unfollow a user
// @access  Private
router.post('/follow', [
  verifyToken,
  check('userId', 'User ID is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;
    const currentUserId = req.user.id;

    // Prevent self-following
    if (userId === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Check if follow relationship exists
    let follow = await Follow.findOne({
      follower: currentUserId,
      following: userId
    });

    if (follow) {
      // If following, unfollow
      await Follow.deleteOne({ _id: follow._id });
      return res.json({ 
        message: 'User unfollowed successfully',
        isFollowing: false
      });
    } else {
      // If not following, follow
      follow = new Follow({
        follower: currentUserId,
        following: userId
      });
      await follow.save();
      return res.json({ 
        message: 'User followed successfully',
        isFollowing: true
      });
    }
  } catch (error) {
    console.error('Error updating follow status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// @route   GET /api/community/following
// @desc    Get list of users being followed by current user
// @access  Private
router.get('/following', verifyToken, async (req, res) => {
  try {
    const following = await Follow.find({ follower: req.user.id })
      .select('following')
      .populate('following', 'username');

    res.json(following.map(f => f.following));
  } catch (error) {
    console.error('Error fetching following list:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/community/followers
// @desc    Get list of users following current user
// @access  Private
router.get('/followers', verifyToken, async (req, res) => {
  try {
    const followers = await Follow.find({ following: req.user.id })
      .select('follower')
      .populate('follower', 'username');

    res.json(followers.map(f => f.follower));
  } catch (error) {
    console.error('Error fetching followers list:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/community/posts/follow
// @desc    Follow/Unfollow a user
// @access  Private
router.post('/posts/follow', [
  verifyToken,
  check('userId', 'User ID is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;
    if (req.user.id === userId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    let follow = await Follow.findOne({ follower: req.user.id, following: userId });

    if (follow) {
      await follow.remove();
      return res.json({ message: 'User unfollowed', isFollowing: false });
    } else {
      follow = new Follow({
        follower: req.user.id,
        following: userId
      });
      await follow.save();
      return res.json({ message: 'User followed', isFollowing: true });
    }
  } catch (error) {
    console.error('Error toggling follow status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/community/posts/follow/status/:userId
// @desc    Check if the current user is following another user
// @access  Private
router.get('/posts/follow/status/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id === userId) {
      return res.json({ isFollowing: false }); // A user cannot follow themselves
    }

    const follow = await Follow.findOne({ follower: req.user.id, following: userId });
    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
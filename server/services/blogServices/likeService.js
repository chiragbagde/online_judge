const Blog = require('../../models/Blog');

/**
 * Toggle like on a blog post
 * @param {string} blogId - The ID of the blog post
 * @param {string} userId - The ID of the user liking/unliking
 * @returns {Promise<Object>} The updated likes count and whether the user liked the post
 */
const toggleLike = async (blogId, userId) => {
  try {
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      throw new Error('Blog not found');
    }

    const likeIndex = blog.likes.findIndex(
      id => id.toString() === userId
    );

    let liked = false;
    
    if (likeIndex === -1) {
      // Add like
      blog.likes.push(userId);
      liked = true;
    } else {
      // Remove like
      blog.likes.splice(likeIndex, 1);
    }

    await blog.save();

    return {
      success: true,
      data: {
        likesCount: blog.likes.length,
        liked
      }
    };
  } catch (error) {
    console.error('Error toggling like:', error);
    return {
      success: false,
      message: error.message || 'Error toggling like'
    };
  }
};

/**
 * Check if a user has liked a blog post
 * @param {string} blogId - The ID of the blog post
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object>} Whether the user has liked the post
 */
const checkIfLiked = async (blogId, userId) => {
  try {
    const blog = await Blog.findOne({
      _id: blogId,
      likes: { $in: [userId] }
    });

    return {
      success: true,
      data: {
        liked: !!blog
      }
    };
  } catch (error) {
    console.error('Error checking like status:', error);
    return {
      success: false,
      message: error.message || 'Error checking like status'
    };
  }
};

/**
 * Get the number of likes for a blog post
 * @param {string} blogId - The ID of the blog post
 * @returns {Promise<Object>} The number of likes
 */
const getLikesCount = async (blogId) => {
  try {
    const blog = await Blog.findById(blogId).select('likes');
    
    if (!blog) {
      throw new Error('Blog not found');
    }

    return {
      success: true,
      data: {
        likesCount: blog.likes.length
      }
    };
  } catch (error) {
    console.error('Error getting likes count:', error);
    return {
      success: false,
      message: error.message || 'Error getting likes count'
    };
  }
};

module.exports = {
  toggleLike,
  checkIfLiked,
  getLikesCount
};

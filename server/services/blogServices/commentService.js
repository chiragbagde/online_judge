const Blog = require('../../models/Blog');
const { v4: uuidv4 } = require('uuid');

/**
 * Add a comment to a blog post
 * @param {string} blogId - The ID of the blog post
 * @param {string} userId - The ID of the user adding the comment
 * @param {string} content - The comment content
 * @returns {Promise<Object>} The updated blog post
 */
const addComment = async (blogId, userId, content) => {
  try {
    const comment = {
      user: userId,
      content: content.trim(),
      createdAt: new Date()
    };

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { $push: { comments: comment } },
      { new: true, runValidators: true }
    )
    .populate('comments.user', 'name email')
    .populate('author', 'name email');

    if (!updatedBlog) {
      throw new Error('Blog not found');
    }

    return {
      success: true,
      data: updatedBlog.comments[updatedBlog.comments.length - 1]
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return {
      success: false,
      message: error.message || 'Error adding comment'
    };
  }
};

/**
 * Get all comments for a blog post
 * @param {string} blogId - The ID of the blog post
 * @returns {Promise<Object>} The blog post comments
 */
const getComments = async (blogId) => {
  try {
    const blog = await Blog.findById(blogId)
      .select('comments')
      .populate('comments.user', 'name email');

    if (!blog) {
      throw new Error('Blog not found');
    }

    return {
      success: true,
      data: blog.comments
    };
  } catch (error) {
    console.error('Error getting comments:', error);
    return {
      success: false,
      message: error.message || 'Error getting comments'
    };
  }
};

/**
 * Delete a comment from a blog post
 * @param {string} blogId - The ID of the blog post
 * @param {string} commentId - The ID of the comment to delete
 * @param {string} userId - The ID of the user requesting deletion
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Object>} The result of the operation
 */
const deleteComment = async (blogId, commentId, userId, isAdmin = false) => {
  try {
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      throw new Error('Blog not found');
    }

    const commentIndex = blog.comments.findIndex(
      comment => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    const comment = blog.comments[commentIndex];
    
    // Check if user is the comment author or an admin
    if (comment.user.toString() !== userId && !isAdmin) {
      throw new Error('Not authorized to delete this comment');
    }

    blog.comments.splice(commentIndex, 1);
    await blog.save();

    return {
      success: true,
      message: 'Comment deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return {
      success: false,
      message: error.message || 'Error deleting comment'
    };
  }
};

/**
 * Update a comment
 * @param {string} blogId - The ID of the blog post
 * @param {string} commentId - The ID of the comment to update
 * @param {string} userId - The ID of the user updating the comment
 * @param {string} content - The updated comment content
 * @returns {Promise<Object>} The updated comment
 */
const updateComment = async (blogId, commentId, userId, content) => {
  try {
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      throw new Error('Blog not found');
    }

    const comment = blog.comments.id(commentId);
    
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.user.toString() !== userId) {
      throw new Error('Not authorized to update this comment');
    }

    comment.content = content.trim();
    comment.updatedAt = new Date();
    
    await blog.save();

    return {
      success: true,
      data: comment
    };
  } catch (error) {
    console.error('Error updating comment:', error);
    return {
      success: false,
      message: error.message || 'Error updating comment'
    };
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment,
  updateComment
};

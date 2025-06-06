const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const { addComment } = require('../services/blogServices/commentService');
const { toggleLike } = require('../services/blogServices/likeService');
const { v4: uuidv4 } = require('uuid');
const { DBConnection } = require('../database/db');
require('dotenv').config();

// Sample user IDs for comments and likes
const SAMPLE_USER_IDS = [
  '5f8d0d55b54764421b7156c4',
  '5f8d0d55b54764421b7156c5',
  '5f8d0d55b54764421b7156c6',
  '5f8d0d55b54764421b7156c7',
  '5f8d0d55b54764421b7156c8',
];

// Sample comments
const SAMPLE_COMMENTS = [
  'Great post! Really enjoyed reading this.',
  'Thanks for sharing this valuable information.',
  'I found this very helpful. Keep up the good work!',
  'Could you elaborate more on the second point?',
  'This is exactly what I was looking for!',
  'Very insightful. Looking forward to more content like this.',
  'I have a different perspective on this topic.',
  'Well written and easy to understand.',
  'Thanks for the detailed explanation.',
  'This helped me solve my problem. Thank you!',
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await DBConnection();
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Get a random element from an array
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Add sample likes to a blog
const addSampleLikes = async (blogId) => {
  try {
    console.log(`Starting to add likes for blog ${blogId}...`);
    // Random number of likes between 5 and 20
    const likeCount = Math.min(5, Math.floor(Math.random() * 16) + 5); // Reduced max likes to 5 for testing
    
    // Use a Set to ensure unique user IDs
    const uniqueUserIds = new Set();
    
    // Generate unique user IDs
    while (uniqueUserIds.size < likeCount) {
      const userId = getRandomElement(SAMPLE_USER_IDS);
      console.log(`Generated user ID for like: ${userId}`);
      uniqueUserIds.add(userId);
    }
    
    console.log(`Attempting to add ${uniqueUserIds.size} likes...`);
    
    // Add likes with better error handling
    let successfulLikes = 0;
    for (const userId of uniqueUserIds) {
      try {
        console.log(`Toggling like for user ${userId} on blog ${blogId}...`);
        const result = await toggleLike(blogId, userId);
        console.log(`Like toggled successfully for user ${userId}:`, result);
        successfulLikes++;
      } catch (error) {
        console.error(`Failed to toggle like for user ${userId}:`, error.message);
        console.error('Error details:', error);
      }
    }
    
    console.log(`Successfully added ${successfulLikes} likes to blog ${blogId}`);
    return successfulLikes;
  } catch (error) {
    console.error('Error in addSampleLikes:', error);
    console.error('Stack trace:', error.stack);
    return 0;
  }
};

// Add sample comments to a blog
const addSampleComments = async (blogId) => {
  try {
    // Random number of comments between 2 and 8
    const commentCount = Math.floor(Math.random() * 7) + 2;
    
    for (let i = 0; i < commentCount; i++) {
      const userId = getRandomElement(SAMPLE_USER_IDS);
      const content = getRandomElement(SAMPLE_COMMENTS);
      
      await addComment(blogId, userId, content);
    }
    
    console.log(`Added ${commentCount} comments to blog ${blogId}`);
    return commentCount;
  } catch (error) {
    console.error('Error adding comments:', error);
    return 0;
  }
};

// Main function to update top blogs
const updateTopBlogs = async () => {
  try {
    await connectDB();
    
    // Get top 10 most recent published blogs
    const topBlogs = await Blog.find({ })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(10)
      .select('_id');
    
    if (topBlogs.length === 0) {
      console.log('No published blogs found.');
      process.exit(0);
    }
    
    console.log(`Found ${topBlogs.length} blogs to update.`);
    
    // Process each blog
    for (const blog of topBlogs) {
      console.log(`\nUpdating blog ${blog._id}...`);
      
      // Add likes
      const likeCount = await addSampleLikes(blog._id);
      
      // Add comments
      const commentCount = await addSampleComments(blog._id);
      
      console.log(`Updated blog ${blog._id} with ${likeCount} likes and ${commentCount} comments.`);
    }
    
    console.log('\nAll top blogs have been updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating top blogs:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  updateTopBlogs();
}

module.exports = updateTopBlogs;

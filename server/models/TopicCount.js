const mongoose = require("mongoose");

const topicDescriptions = {
  'arrays': 'Master array manipulation and common patterns. Practice solving problems involving array traversal, searching, sorting, and common array algorithms.',
  'strings': 'Solve string manipulation and pattern matching problems. Learn about string operations, regular expressions, and string algorithms.',
  'trees': 'Master tree traversals and common tree algorithms. Practice problems on binary trees, BST, AVL trees, and tree-based algorithms.',
  'recursion': 'Learn and implement various recursive algorithms. Understand recursion patterns, backtracking, and divide-and-conquer techniques.',
  'dynamic programming': 'Solve problems using dynamic programming techniques. Master memoization, tabulation, and common DP patterns.',
  'graphs': 'Master graph algorithms and traversals. Practice problems on BFS, DFS, shortest paths, minimum spanning trees, and graph connectivity.',
  'linked list': 'Master Linked List Algorithms and Traversals. Practice problems on singly linked lists, doubly linked lists, and common linked list operations.',
  'bit manipulation': 'Master Bit Manipulation Algorithms and Traversals. Learn about bitwise operations, bit masks, and efficient bit manipulation techniques.',
  'binary search': 'Master Binary Search and its applications. Practice problems on binary search, binary search trees, and related algorithms.'
};

const topicCountSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    unique: true,
    enum: Object.keys(topicDescriptions)
  },
  count: {
    type: Number,
    required: true,
    default: 0
  },
  description: {
    type: String,
    required: true,
    get: function() {
      return topicDescriptions[this.topic] || 'Practice problems in this topic';
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

topicCountSchema.statics.updateCounts = async function() {
  const Problem = mongoose.model('problem');
  
  try {
    const topicCounts = await Problem.aggregate([
      { $group: { _id: "$topic", count: { $sum: 1 } } }
    ]);

    for (const { _id: topic, count } of topicCounts) {
      if (topicDescriptions[topic]) {
        await this.findOneAndUpdate(
          { topic },
          { 
            topic,
            count,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
      }
    }

    const existingTopics = topicCounts.map(tc => tc._id);
    await this.deleteMany({ topic: { $nin: existingTopics } });

    return topicCounts;
  } catch (error) {
    console.error('Error updating topic counts:', error);
    throw error;
  }
};

topicCountSchema.statics.getValidTopics = function() {
  return Object.keys(topicDescriptions);
};

topicCountSchema.statics.getTopicDescription = function(topic) {
  return topicDescriptions[topic] || 'Practice problems in this topic';
};

module.exports = mongoose.model("TopicCount", topicCountSchema); 
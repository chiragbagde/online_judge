const mongoose = require("mongoose");

const exampleSchema = mongoose.Schema({
  input: {
    type: String,
    default: null,
  },
  output: {
    type: String,
    default: null,
  },
  explanation: {
    type: String,
    default: null,
  },
});

const problemSchema = mongoose.Schema({
  statement: {
    type: String,
    default: null,
  },

  description: [
    {
      type: String,
      default: null,
    },
  ],
  constraints: [
    {
      type: String,
      default: null,
    },
  ],
  difficulty: {
    type: String,
    default: null,
  },
  topic: {
    type: String,
    default: null,
  },
  solution: {
    type: String,
    default: null,
  },
  image: {
    type: Buffer,
    contentType: String,
  },
  input: {
    type: String,
    default: null,
  },
  examples: [exampleSchema], // Array of example objects
});

const Problem = mongoose.model("problem", problemSchema);

module.exports = Problem;

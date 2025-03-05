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

const Example = mongoose.model("Example", exampleSchema);

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
  competition_problem: {
    type: Boolean,
    default: false,
  },
  input: {
    type: String,
    default: null,
  },
  dailyDate: { 
    type: Date, 
    default: null 
  },
  examples: [exampleSchema],
}, {timestamps: true});

const Problem = mongoose.model("problem", problemSchema);

module.exports = Problem;

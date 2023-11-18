const mongoose = require("mongoose");

const problemSchema = mongoose.Schema({
  statement: {
    type: String,
    default: null,
  },
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
});

const Problem = mongoose.model("problem", problemSchema);

module.exports = Problem;

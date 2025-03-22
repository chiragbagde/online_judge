const mongoose = require("mongoose");

const TestCaseSchema = mongoose.Schema({
  p_id: {
    type: mongoose.Schema.Types.ObjectId, // Reference to Problem (nullable initially)
    ref: "Problem",
    default: null,
  },
  input: {
    type: String,
    required: true,
  },
  output: {
    type: String,
    required: true,
  },
});

const TestCase = mongoose.model("testcase", TestCaseSchema);

module.exports = TestCase;

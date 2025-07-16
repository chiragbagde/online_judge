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
  description: {
    type: String,
    default: null,
  },
});

const TestCase = mongoose.models.testcase || mongoose.model("testcase", TestCaseSchema);

module.exports = TestCase;

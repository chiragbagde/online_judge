const mongoose = require("mongoose");

const TestCaseSchema = mongoose.Schema({
  p_id: {
    type: String,
    ref: "Problem",
  },
  input: [
    {
      type: String,
      default: null,
    },
  ],
  output: [
    {
      type: String,
      default: null,
    },
  ],
});

const TestCase = mongoose.model("testcase", TestCaseSchema);

module.exports = TestCase;

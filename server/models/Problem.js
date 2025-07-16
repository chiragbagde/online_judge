const mongoose = require("mongoose");

const problemSchema = mongoose.Schema(
  {
    statement: { type: String, default: null },
    description: [{ type: String, default: null }],
    constraints: [{ type: String, default: null }],
    difficulty: { type: String, default: null },
    topic: { type: String, default: null },
    solution: { type: String, default: null },
    image: { type: Buffer, contentType: String },
    competition_problem: { type: Boolean, default: false },
    input: { type: String, default: null },
    dailyDate: { type: Date, default: null },
    snippet: { type: String, default: null },
    examples: [
      {
        input: { type: String, default: null },
        output: { type: String, default: null },
        explanation: { type: String, default: null },
      },
    ],
    testCases: [{ type: mongoose.Schema.Types.ObjectId, ref: "testcase" }],
  },
  { timestamps: true }
);

const Problem =
  mongoose.models.problem || mongoose.model("problem", problemSchema);

module.exports = Problem;

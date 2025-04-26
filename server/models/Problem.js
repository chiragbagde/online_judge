const mongoose = require("mongoose");
const TestCase = require("./TestCase");
const Example = require("./Example"); // 💥 import the Example model

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
    examples: [Example.schema], // 🔥 Use the schema from Example model
    testCases: [{ type: mongoose.Schema.Types.ObjectId, ref: "testcase" }],
  },
  { timestamps: true }
);

const Problem =
  mongoose.models.problem || mongoose.model("problem", problemSchema);

module.exports = Problem;

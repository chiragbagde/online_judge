const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const listSchema = mongoose.Schema(
  {
    description: { type: String, default: null },
    name: { type: String, default: null },
    user_id: { type: String, default: uuidv4 },
    problems: [
      {
        input: { type: String, default: null },
        output: { type: String, default: null },
        explanation: { type: String, default: null },
      },
    ],
    problems: [{ type: mongoose.Schema.Types.ObjectId, ref: "problem" }], // Corrected reference
  },
  { timestamps: true }
);

const List =
  mongoose.models.list || mongoose.model("list", listSchema);

module.exports = List;

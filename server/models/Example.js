const mongoose = require("mongoose");

const exampleSchema = mongoose.Schema({
  input: { type: String, default: null },
  output: { type: String, default: null },
  explanation: { type: String, default: null },
});

const Example =
  mongoose.models.Example || mongoose.model("Example", exampleSchema);

module.exports = Example;

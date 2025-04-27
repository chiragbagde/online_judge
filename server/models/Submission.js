const mongoose = require("mongoose");

const submissionSchema = mongoose.Schema({
  u_id: {
    type: String,
    ref:"user",
  },
  p_id: {
    type: String,
    ref: "problem",
  },
  c_id: {
    type: String,
    ref: "competition",
    default: null,
  },
  verdict: {
    type: String,
  },
  solution: {
    type: String,
  },
  language: {
    type: String,
  },
  submitted_at: {
    type: Date,
  },
});

const Submission = mongoose.models.submission || mongoose.model("submission", submissionSchema);

module.exports = Submission;

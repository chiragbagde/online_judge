const mongoose = require("mongoose");

const submissionSchema = mongoose.Schema({
  u_id: {
    type: String,
    ref: "User",
  },
  p_id: {
    type: String,
    ref: "Problem",
  },
  c_id: {
    type: String,
    ref: "Competiton",
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

const Submission = mongoose.model("submission", submissionSchema);

module.exports = Submission;

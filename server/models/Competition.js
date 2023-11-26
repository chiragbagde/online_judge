const mongoose = require("mongoose");
const Problem = require("./Problem");

const CompetitionSchema = mongoose.Schema({
  start_date: {
    type: Date,
  },
  end_date: {
    type: Date,
  },
  problems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: Problem,
    },
  ],
});

const Competition = mongoose.model("competition", CompetitionSchema);

module.exports = Competition;

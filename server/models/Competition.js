const mongoose = require("mongoose");
const Problem = require("./Problem");
const User = require("./User");

const CompetitionSchema = mongoose.Schema({
  start_date: {
    type: Date,
  },
  title: {
    type: String,
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
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
    },
  ],
});

CompetitionSchema.methods.registerUser = function (userId) {
  if (!this.user.includes(userId)) {
    this.user.push(userId);
  }
};

const Competition = mongoose.model("competition", CompetitionSchema);

module.exports = Competition;

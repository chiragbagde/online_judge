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
  users: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

CompetitionSchema.methods.registerUser = function (userId) {
  const isUserRegistered = this.users?.some((user) =>
    user.userId.equals(userId)
  );

  if (!isUserRegistered) {
    this.users = this.users || [];

    this.users.push({ userId: userId, timestamp: new Date() });
  }
};

const Competition = mongoose.model("competition", CompetitionSchema);

module.exports = Competition;

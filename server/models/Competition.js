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
      },
    },
  ],
});

CompetitionSchema.methods.registerUser = function (userId) {
  this.users = this.users || [];
  const existingUser = this.users.find((user) => user.userId.equals(userId));

  if(existingUser){
    existingUser.timestamp = new Date();
  } else{
    this.users.push({userId: userId, timestamp: new Date()});
  }
};

CompetitionSchema.methods.addUser = function (userId) {
  const isUserRegistered = this.users?.some((user) =>
    user.userId.equals(userId)
  );

  if (!isUserRegistered) {
    this.users = this.users || [];

    this.users.push({ userId: userId, timestamp: null  });
  }
};

const Competition = mongoose.model("competition", CompetitionSchema);

module.exports = Competition;

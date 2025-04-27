const mongoose = require("mongoose");

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
      ref: "problem",
    },
  ],
  users: [
    {
      userId: {
        type: String,
        ref: "user",
      },
      timestamp: {
        type: Date,
      },
    },
  ],
});

CompetitionSchema.methods.registerUser = function (userId) {
  this.users = this.users || [];
  console.log(this.users);
  
  const existingUser = this.users.find((user) => user.userId === userId);

  if(existingUser){
    existingUser.timestamp = new Date();
  } else{
    this.users.push({userId: userId, timestamp: new Date()});
  }
};

CompetitionSchema.methods.addUser = function (userId) {
  const isUserRegistered = this.users?.some((user) => user.userId === userId);

  if (!isUserRegistered) {
    this.users = this.users || [];

    this.users.push({ userId: userId, timestamp: null  });
  }
};

const Competition = mongoose.models.competition || mongoose.model("competition", CompetitionSchema);

module.exports = Competition;

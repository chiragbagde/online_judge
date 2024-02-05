const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstname: {
    type: String,
    default: null,
  },
  lastname: {
    type: String,
    default: null,
  },
  username: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    default: null,
  },
  mobile: {
    type: Number,
    default: null,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    default: "user",
  },
});

const User = mongoose.model("user", userSchema);

module.exports = User;

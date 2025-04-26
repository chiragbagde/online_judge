const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: { type: String, default: null },
  lastname: { type: String, default: null },
  username: { type: String, default: null },
  email: { type: String, default: null },
  mobile: { type: Number, default: null },
  password: { type: String },
  role: { type: String, default: "user" },
  userId: { type: String },
});

// VERY IMPORTANT: Check if model already exists
const User = mongoose.models.user || mongoose.model("user", userSchema);

module.exports = User;

const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  firstname: { type: String, default: null },
  lastname: { type: String, default: null },
  username: { type: String, default: null },
  email: { type: String, default: null },
  mobile: { type: Number, default: null },
  password: { type: String },
  role: { type: String, default: "user" },
});


// VERY IMPORTANT: Check if model already exists
const User = mongoose.models.user || mongoose.model("user", userSchema);

module.exports = User;

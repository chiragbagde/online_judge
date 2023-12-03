const mongoose = require("mongoose");
const User = require("../models/User");

const socialSchema = mongoose.Schema({
  u_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
  website: {
    type: String,
    default: "",
  },
  github: {
    type: String,
    default: "",
  },
  twitter: {
    type: String,
    default: "",
  },
  instagram: {
    type: String,
    default: "",
  },
  facebook: {
    type: String,
    default: "",
  },
  linkedin: {
    type: String,
    default: "",
  },
});

const social = mongoose.model("social", socialSchema);

module.exports = social;

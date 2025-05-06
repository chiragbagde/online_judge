const mongoose = require("mongoose");

const socialSchema = mongoose.Schema({
  u_id: {
    type: String,
    ref: "user",
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

const social = mongoose.models.social || mongoose.model("social", socialSchema);

module.exports = social;

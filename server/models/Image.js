var mongoose = require("mongoose");
var User = require("./User");

var imageSchema = new mongoose.Schema({
  name: String,
  desc: String,
  img: {
    data: Buffer,
    contentType: String,
  },
  imageUrl: String,
  u_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
});

module.exports = mongoose.model("Image", imageSchema);

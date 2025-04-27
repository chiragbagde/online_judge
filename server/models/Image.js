var mongoose = require("mongoose");

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
    ref: "user",
  },
});

module.exports = mongoose.models.Image || mongoose.model("Image", imageSchema);

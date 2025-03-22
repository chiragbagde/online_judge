const mongoose = require("mongoose");
require("dotenv").config();

const DBConnection = async () => {
  const MONGO_URL = "mongodb+srv://chiragsbagde:Test123@cluster0.y2bwvnd.mongodb.net/";
  console.log(MONGO_URL);
  try {
    await mongoose.connect(MONGO_URL, { useNewUrlParser: true });
    console.log("DB connected successfully!");
  } catch (error) {
    console.log("Error while connecting with the DB ", error.message);
  }
};

module.exports = { DBConnection };

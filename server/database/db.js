const mongoose = require("mongoose");
require("dotenv").config();

const DBConnection = async () => {
  const MONGO_URL = process.env.DB_URL;
  try {
    await mongoose.connect(MONGO_URL, { useNewUrlParser: true });
    console.log("DB connected successfully!");
  } catch (error) {
    console.log("Error while connecting with the DB ", error.message);
  }
};

module.exports = { DBConnection };

const mongoose = require("mongoose");
require("dotenv").config();

const DBConnection = async () => {
  const MONGO_URL = process.env.DB_URL;
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      keepAlive: true,
      keepAliveInitialDelay: 300000, // 5 minutes
    };
    await mongoose.connect(MONGO_URL, options);
    console.log("DB connected successfully!");
  } catch (error) {
    console.log("Error while connecting with the DB ", error.message);
    throw error; // Re-throw the error to be caught by the server start logic
  }
};

module.exports = { DBConnection };

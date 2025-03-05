const mongoose = require("mongoose");
const Problem = require("../models/Problem");
const { DBConnection } = require("../database/db");

(async () => {
  try {
    DBConnection();
    const problems = await Problem.find({}).sort({ createdAt: -1 });
    const today = new Date();

    for (let i = 0; i < problems.length; i++) {
      const dailyDate = new Date(today);
      dailyDate.setDate(today.getDate() - i);
      problems[i].dailyDate = dailyDate;
      await problems[i].save();
      console.log(
        `Updated date for problem id ${
          problems[i]._id
        } with date ${dailyDate.toDateString()}`
      );
    }

    console.log("All problems updated with daily dates.");
  } catch (error) {
    console.error("Error updating problems:", error);
  } finally {
    mongoose.connection.close();
  }
})();


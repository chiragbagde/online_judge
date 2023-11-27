// codeRoutes.js
const express = require("express");
const competition = require("./../models/Competition");

const router = express.Router();

router.post("/create", async (req, res) => {
  const { start_date, end_date, problems, title } = req.body;

  if (!(start_date && end_date && problems)) {
    return res.status(400).send("Please enter all the information.");
  }
  let s_date = new Date(start_date);
  let l_date = new Date(end_date);
  let newcompetiton = await competition.create({
    problems,
    title,
    start_date: s_date,
    end_date: l_date,
  });

  res.status(200).json({
    message: "You have added a new competition!",
    newcompetiton,
  });
});

router.post("/update", async (req, res) => {
  const { start_date, end_date, problems, id } = req.body;

  if (!id) {
    return res.status(400).send("Please enter an id to update");
  }

  const filter = { _id: id };
  const updatedDoc = {};

  if (start_date !== undefined) {
    updatedDoc.start_date = start_date;
  }

  if (end_date !== undefined) {
    updatedDoc.end_date = end_date;
  }

  if (problems !== undefined) {
    updatedDoc.problems = problems;
  }

  try {
    let updatecompetition = await competition.updateOne(filter, updatedDoc);

    res.status(200).json({
      message: "Competition updated successfully",
      updatecompetition,
    });
  } catch (error) {
    console.error("Error updating Competition:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.post("/registeruser", async (req, res) => {
  const { user_id, id } = req.body;

  if (!id) {
    return res.status(400).send("Please enter an id to update");
  }
  let competition_id;
  try {
    if (user_id !== undefined) {
      competition_id = await competition.findById(id);
      competition_id.registerUser(user_id);
      await competition_id.save();
    }
    res.status(200).json({
      message: "User registered successfully",
      competition_id,
    });
  } catch (error) {
    console.error("Error registering User:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.get("/", async (req, res) => {
  let competitions = await competition.find({});

  res.status(200).json({
    message: "competitions retreived successfully!",
    competitions,
  });
});

router.post("/id", async (req, res) => {
  const { id } = req.body;

  try {
    const fetchedCompetition = await competition
      .findOne({ _id: id })
      .populate("problems")
      .exec();

    res.status(200).json({
      message: "Competition fetched successfully",
      fetchedCompetition,
    });
  } catch (error) {
    console.error("Error getting competition:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.delete("/", async (req, res) => {
  const { id } = req.body;

  const del = await competition.deleteOne({ _id: id });

  if (del.deletedCount === 0) {
    res.status(400).json({
      message: "Invalid id",
    });
  } else {
    res.status(200).json({
      message: "compeition deleted successfully",
      del,
    });
  }
});

module.exports = router;

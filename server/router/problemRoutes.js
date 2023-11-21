// codeRoutes.js
const express = require("express");
const problem = require("./../models/Problem");

const router = express.Router();

router.post("/create", async (req, res) => {
  const {
    statement,
    difficulty,
    topic,
    solution,
    input,
    examples,
    constraints,
    description,
  } = req.body;

  if (!(statement && difficulty && topic && solution)) {
    return res.status(400).send("Please enter all the information.");
  }
  let newprob = await problem.create({
    statement,
    difficulty,
    topic,
    solution,
    input,
    examples,
    constraints,
    description,
  });

  res.status(200).json({
    message: "You have added a new problem!",
    newprob,
  });
});

router.post("/update", async (req, res) => {
  const { statement, difficulty, topic, solution, input, id } = req.body;

  if (!id) {
    return res.status(400).send("Please enter an id to update");
  }

  const filter = { _id: id };
  const updatedDoc = {};

  if (statement !== undefined) {
    updatedDoc.statement = statement;
  }

  if (difficulty !== undefined) {
    updatedDoc.difficulty = difficulty;
  }

  if (topic !== undefined) {
    updatedDoc.topic = topic;
  }

  if (solution !== undefined) {
    updatedDoc.solution = solution;
  }

  if (input !== undefined) {
    updatedDoc.input = input;
  }

  try {
    let updateprob = await problem.updateOne(filter, updatedDoc);

    res.status(200).json({
      message: "Problem updated successfully",
      updateprob,
    });
  } catch (error) {
    console.error("Error updating problem:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.get("/", async (req, res) => {
  let problems = await problem.find({});

  res.status(200).json({
    message: "problems retreived successfully!",
    problems,
  });
});

router.post("/id", async (req, res) => {
  const { id } = req.body;

  try {
    let customprob = await problem.findOne({ _id: id });

    res.status(200).json({
      message: "Problem fetched successfully",
      customprob,
    });
  } catch (error) {
    console.error("Error getting problem:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.delete("/", async (req, res) => {
  const { id } = req.body;

  const del = await problem.deleteOne({ _id: id });

  if (del.deletedCount === 0) {
    res.status(400).json({
      message: "Invalid id",
    });
  } else {
    res.status(200).json({
      message: "problems deleted successfully",
      del,
    });
  }
});

module.exports = router;

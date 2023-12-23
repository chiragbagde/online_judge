// codeRoutes.js
const express = require("express");
const problem = require("./../models/Problem");
const user = require("./../models/User");
const verifyToken = require("../verifyToken");

const router = express.Router();

router.post("/create", verifyToken, async (req, res) => {
  const {
    statement,
    difficulty,
    topic,
    solution,
    input,
    examples,
    constraints,
    competition_problem,
    description,
  } = req.body;

  if (!(statement && difficulty && topic)) {
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
    competition_problem,
  });

  res.status(200).json({
    message: "You have added a new problem!",
    newprob,
  });
});

router.post("/update", verifyToken, async (req, res) => {
  const {
    statement,
    difficulty,
    topic,
    solution,
    competition_problem,
    input,
    id,
  } = req.body;

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

  if (competition_problem !== undefined) {
    updatedDoc.competition_problem = competition_problem;
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

router.get("/", verifyToken, async (req, res) => {
  let problems = await problem.find({ competition_problem: false });

  res.status(200).json({
    message: "problems retreived successfully!",
    problems,
  });
});

router.post("/id", verifyToken, async (req, res) => {
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

router.delete("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;

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

router.get("/admin/:id", async (req, res) => {
  const id = req.params.id;

  const admin = await user.findOne({ _id: id });
  if (admin.role !== "admin") {
    res.status(400).json({
      message: "Couldn't fetch data",
    });
  }

  let problems = await problem.find();

  res.status(200).json({
    message: "problems retreived successfully!",
    problems,
  });
});

router.get("/admin/ids/:id", async (req, res) => {
  const id = req.params.id;

  const admin = await user.findOne({ _id: id });
  if (admin.role !== "admin") {
    res.status(400).json({
      message: "Couldn't fetch data",
    });
  }

  let problems = await problem.find().select(["statement", ["topic"]]);

  res.status(200).json({
    message: "problems retreived successfully!",
    problems,
  });
});

module.exports = router;

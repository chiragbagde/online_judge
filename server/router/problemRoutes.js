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

router.post("/create/many", verifyToken, async (req, res) => {
  try {
    const problems = req.body;

    if (!Array.isArray(problems) || problems.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid input: Expecting an array of problems." });
    }

    let createdProblems = [];

    for (const _problem of problems) {
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
      } = _problem;

      if (statement && difficulty && topic) {
        const newProb = await problem.create({
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

        createdProblems.push(newProb._id);
      }
    }

    res.status(201).json({
      message: "Problems added successfully!",
      createdProblems,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding problems",
      error: error.message,
    });
  }
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

router.get("/topic-counts", verifyToken, async (req, res) => {
  try {
    const topicCounts = await problem.aggregate([
      { $group: { _id: "$topic", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      message: "Topic counts retrieved successfully!",
      topicCounts,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
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

router.get("/search/:search", async (req, res) => {
  const search = req.params.search;

  try {
    const problems = await problem.find({
      statement: { $regex: search, $options: "i" },
    }).limit(10);
    res.status(200).json({
      message: "Problems retrieved successfully!",
      problems,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
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

// codeRoutes.js
const express = require("express");
const competition = require("./../models/Competition");
const problem = require("./../models/Problem");
const user = require("./../models/User");
const verifyToken = require("../verifyToken");
const Submission = require("../models/Submission");
const User = require("./../models/User");
const { sql } = require("../database/neon");

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
    competiton: newcompetiton,
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
      message: "User added to competition successfully",
      competition_id,
    });
  } catch (error) {
    console.error("Error registering User:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.post("/adduser", async (req, res) => {
  const { user_id, id } = req.body;

  if (!id) {
    return res.status(400).send("Please enter an id to update");
  }
  let competition_id;
  try {
    if (user_id !== undefined) {
      competition_id = await competition.findById(id);
      competition_id.addUser(user_id);
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

router.get("/", verifyToken, async (req, res) => {
  const {id} = req.query;
  let competitions = await competition.find({});
  competitions = competitions.map((comp) => {
    const { users, ...rest } = comp._doc;
    return {
      ...rest,
      user: comp.users.filter((user) => String(user.userId) === id)[0],
    };
  })
  res.status(200).json({
    message: "competitions retreived successfully!",
    competitions,
  });
});

router.post("/problem/id", verifyToken, async (req, res) => {
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

router.post("/timestamp", verifyToken, async (req, res) => {
  const { id, userId } = req.body;

  try {
    const fetchedCompetition = await competition.findOne({ _id: id });
    const user = fetchedCompetition.users.filter(
      (user) => String(user.userId) === userId
    )[0];
    res.status(200).json({
      timestamp: user.timestamp,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.post("/getusersubmisions", verifyToken, async (req, res) => {
  const { u_id, c_id, verdict } = req.body;

  try {
    const submissions = await Submission.find({
      u_id,
      c_id,
      verdict,
    });

    res.status(200).json({
      submissions: submissions,
    });
  } catch (error) {
    console.error("Error retrieving submissions:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.post("/getleaderboard", async (req, res) => {
  const { c_id } = req.body;

  try {
    const leaderboard = await Submission.aggregate([
      { $match: { c_id: c_id, verdict: "passed" } },
      { $group: { _id: "$u_id", totalScore: { $sum: 1 } } },
      { $sort: { totalScore: -1 } },
    ]).exec();
    
    const populatedLeaderboard = await Promise.all(
      leaderboard.map(async (entry) => {
        const userData =
          await sql`SELECT * FROM users WHERE id = ${entry._id} LIMIT 1`;
        return { user: userData[0], totalScore: entry.totalScore };
      })
    );

    res.status(200).json({
      leaderboard: populatedLeaderboard,
    });
  } catch (error) {
    console.error("Error retrieving leaderboard:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.post("/getallsubmisions", async (req, res) => {
  const { c_id } = req.body;

  try {
    const submissions = await Submission.find({c_id});
    const userIds = [...new Set(submissions.map((s) => s.u_id))];

    const usersResult = await sql`
      SELECT id, firstname, lastname, username, email
      FROM users
      WHERE id = ANY(${userIds})
    `;    

    const usersMap = {};
    usersResult.forEach((user) => {
      usersMap[user.id] = user;
    });
    
    const submissionsWithUser = submissions.map((sub) => ({
      ...sub.toObject(),
      user: usersMap[sub.u_id] || null,
    }));

    res.status(200).json({ submissions: submissionsWithUser });
  } catch (error) {
    console.error("Error retrieving submissions:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.post("/overview", verifyToken, async (req, res) => {
  const { id, userId } = req.body;

  try {
    let fetchedCompetition = await competition.findOne({ _id: id });
    const {users, ...rest} = fetchedCompetition._doc;
    fetchedCompetition = {
      ...rest,
      user: fetchedCompetition.users.filter(
        (user) => String(user.userId) === userId
      )[0],
    };
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


router.post("/id", verifyToken, async (req, res) => {
  const { id } = req.body;

  try {
    const fetchedCompetition = await competition.findOne({ _id: id });
    const currentDate = new Date();

    if (
      currentDate >= new Date(fetchedCompetition.start_date) &&
      currentDate <= new Date(fetchedCompetition.end_date)
    ) {
      await fetchedCompetition.populate("problems");

      res.status(200).json({
        message: "Competition fetched successfully",
        fetchedCompetition,
      });
    } else {
      res.status(403).json({
        error: "This competition is not currently active",
      });
    }
  } catch (error) {
    console.error("Error getting competition:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;

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

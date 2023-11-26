// codeRoutes.js
const express = require("express");
const submission = require("./../models/Submission");

const router = express.Router();

router.post("/submit", async (req, res) => {
  const { solution, p_id, u_id, c_id } = req.body;

  if (!(p_id && u_id && solution)) {
    return res.status(400).send("Please enter all the information.");
  }
  let newSubmission = await submission.create({
    solution,
    p_id,
    u_id,
    c_id,
  });

  res.status(200).json({
    message: "Solution successfully submitted!",
    newSubmission,
  });
});

router.get("/", async (req, res) => {
  let solutions = await submission.find({});

  res.status(200).json({
    message: "problems retreived successfully!",
    solutions,
  });
});

router.delete("/", async (req, res) => {
  const { id } = req.body;

  const del = await submission.deleteOne({ _id: id });

  if (del.deletedCount === 0) {
    res.status(400).json({
      message: "Invalid id",
    });
  } else {
    res.status(200).json({
      message: "Submission deleted successfully",
      del,
    });
  }
});

module.exports = router;

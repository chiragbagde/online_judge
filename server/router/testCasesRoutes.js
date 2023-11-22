// codeRoutes.js
const express = require("express");
const testcase = require("../models/TestCase");

const router = express.Router();

router.post("/create", async (req, res) => {
  const { p_id, input, output } = req.body;

  if (!(p_id && input && output)) {
    return res.status(400).send("Please enter all the information.");
  }
  let newtestcase = await testcase.create({
    p_id,
    input,
    output,
  });

  res.status(200).json({
    message: "You have testcase to id " + p_id,
    newtestcase,
  });
});

router.post("/update", async (req, res) => {
  const { p_id, input, output, id } = req.body;

  if (!id) {
    return res.status(400).send("Please enter an id to update");
  }

  const filter = { _id: id };
  const updatedDoc = {};

  if (output !== undefined) {
    updatedDoc.output = output;
  }

  if (p_id !== undefined) {
    updatedDoc.p_id = p_id;
  }

  if (input !== undefined) {
    updatedDoc.input = input;
  }

  try {
    let updateprob = await testcase.updateOne(filter, updatedDoc);

    res.status(200).json({
      message: "TestCase updated successfully",
      updateprob,
    });
  } catch (error) {
    console.error("Error updating testcase:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.get("/", async (req, res) => {
  let problems = await testcase.find({});

  res.status(200).json({
    message: "TestCases retrieved successfully!",
    problems,
  });
});

router.post("/id", async (req, res) => {
  const { id } = req.body;

  try {
    let customtestcase = await testcase.findOne({ _id: id });

    res.status(200).json({
      message: "TestCase fetched successfully",
      customtestcase,
    });
  } catch (error) {
    console.error("Error getting testcase:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.delete("/", async (req, res) => {
  const { id } = req.body;

  const del = await testcase.deleteOne({ _id: id });

  if (del.deletedCount === 0) {
    res.status(400).json({
      message: "Invalid id",
    });
  } else {
    res.status(200).json({
      message: "TestCases deleted successfully",
      del,
    });
  }
});

module.exports = router;

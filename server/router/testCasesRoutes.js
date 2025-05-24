// codeRoutes.js
const express = require("express");
const testcase = require("../models/TestCase");
const verifyToken = require("../verifyToken");
const cache = require("../middleware/cache");
const { redis } = require("../database/redis-store");

const router = express.Router();

router.post("/create", verifyToken, async (req, res) => {
  const { p_id, input, output } = req.body;

  if (!(p_id && input && output)) {
    return res.status(400).send("Please enter all the information.");
  }

  await redis.del(`testcases`);
  await redis.del(`testcase:${p_id}`);

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

router.post("/update", verifyToken, async (req, res) => {
  const { p_id, input, output, id } = req.body;

  if (!id) {
    return res.status(400).send("Please enter an id to update");
  }

  await redis.del(`testcases`);
  await redis.del(`testcase:${p_id}`);

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

router.get("/", verifyToken, cache(() => "testcases"), async (req, res) => {
  let problems = await testcase.find({});

  res.status(200).json({
    message: "TestCases retrieved successfully!",
    problems,
  });
});

router.post("/id", verifyToken, cache((req) => `testcase:${req.body.id}`), async (req, res) => {
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

router.delete("/", verifyToken, async (req, res) => {
  const { id } = req.body;

  await redis.del(`testcases`);
  await redis.del(`testcase:${id}`);

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

// codeRoutes.js
const express = require("express");
const TestCase = require("../models/TestCase");
const Problem = require("../models/Problem");
const verifyToken = require("../verifyToken");
const logger = require("../services/logger");
const { redis } = require("../database/redis-store");

const router = express.Router();

router.post("/bulk-import", verifyToken, async (req, res) => {
  try {
    const { problemId, testCases } = req.body;

    if (!problemId || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        message: "Invalid input: problemId and testCases array required"
      });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        message: "Problem not found"
      });
    }

    const formattedTestCases = testCases.map(tc => ({
      p_id: problemId,
      input: JSON.stringify(tc.input),
      output: JSON.stringify(tc.output)
    }));

    const result = await TestCase.insertMany(formattedTestCases);
    
    const testCaseIds = result.map(tc => tc._id);
    
    await Problem.findByIdAndUpdate(problemId, {
      $push: { testCases: { $each: testCaseIds } }
    });

    await redis.del(`problem:${problemId}`);

    logger.info(`Bulk imported ${result.length} test cases for problem ${problemId}`);

    res.status(201).json({
      message: `Successfully imported ${result.length} test cases`,
      importedCount: result.length,
      testCaseIds: testCaseIds
    });

  } catch (error) {
    logger.error("Error bulk importing test cases:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message
    });
  }
});

router.post("/import-from-file", verifyToken, async (req, res) => {
  try {
    const { problemId, filePath } = req.body;

    if (!problemId || !filePath) {
      return res.status(400).json({
        message: "Invalid input: problemId and filePath required"
      });
    }

    const fs = require("fs");
    const path = require("path");

    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        message: "Test case file not found"
      });
    }

    const testCasesData = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    
    if (!Array.isArray(testCasesData)) {
      return res.status(400).json({
        message: "Invalid file format: expected array of test cases"
      });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        message: "Problem not found"
      });
    }

    const formattedTestCases = testCasesData.map(tc => ({
      p_id: problemId,
      input: JSON.stringify(tc.input),
      output: JSON.stringify(tc.output)
    }));

    const result = await TestCase.insertMany(formattedTestCases);
    
    const testCaseIds = result.map(tc => tc._id);
    
    await Problem.findByIdAndUpdate(problemId, {
      $push: { testCases: { $each: testCaseIds } }
    });

    await redis.del(`problem:${problemId}`);

    logger.info(`Imported ${result.length} test cases from file for problem ${problemId}`);

    res.status(201).json({
      message: `Successfully imported ${result.length} test cases from file`,
      importedCount: result.length,
      testCaseIds: testCaseIds
    });

  } catch (error) {
    logger.error("Error importing test cases from file:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message
    });
  }
});

router.get("/problem/:problemId", verifyToken, async (req, res) => {
  try {
    const { problemId } = req.params;
    
    const testCases = await TestCase.find({ p_id: problemId });
    
    res.status(200).json({
      message: "Test cases retrieved successfully",
      testCases: testCases.map(tc => ({
        id: tc._id,
        input: JSON.parse(tc.input),
        output: JSON.parse(tc.output)
      }))
    });

  } catch (error) {
    logger.error("Error fetching test cases:", error);
    res.status(500).json({
      error: "Internal Server Error"
    });
  }
});

router.delete("/problem/:problemId", verifyToken, async (req, res) => {
  try {
    const { problemId } = req.params;
    
    const result = await TestCase.deleteMany({ p_id: problemId });
    
    await Problem.findByIdAndUpdate(problemId, {
      $set: { testCases: [] }
    });

    await redis.del(`problem:${problemId}`);

    res.status(200).json({
      message: `Deleted ${result.deletedCount} test cases`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    logger.error("Error deleting test cases:", error);
    res.status(500).json({
      error: "Internal Server Error"
    });
  }
});

module.exports = router;

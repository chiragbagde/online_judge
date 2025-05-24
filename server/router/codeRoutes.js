const express = require("express");
const axios = require("axios");
const testcase = require("../models/TestCase");
const submission = require("../models/Submission");
const verifyToken = require("../verifyToken");

const router = express.Router();

router.post("/run", verifyToken, async (req, res) => {
  const { lang = "cpp", code, input } = req.body;

  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Empty code body!" });
  }

  try {
    let output;
      const { data } = await axios.post(
        "https://code-execution-server-owik.onrender.com/api/run",
        {
          code,
          input,
          lang,
        }
      );

    output = data.output;

    res.status(200).json({ output });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post("/submit",verifyToken, async (req, res) => {
  const { lang = "cpp", code, p_id, u_id, c_id } = req.body;

  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Empty code body!" });
  }

  try {
    let filtered_testcase = await testcase.find({ p_id });

    const verifyTestCases = async () => {
      const failedTestCases = [];
      const promises = filtered_testcase.map(async (testcase, index) => {
        const input = testcase["input"];
        const output = testcase["output"];

        let outputResult;
        const { data } = await axios.post(
          "https://code-execution-server-owik.onrender.com/api/run",
          {
            code,
            input,
            lang,
          }
        );

        outputResult = data.output;

        if (outputResult.trim() !== output.trim()) {
          failedTestCases.push({
            index: index + 1,
            expected: output,
            actual: outputResult.trim(),
          });
        }
      });

      await Promise.all(promises);
      return failedTestCases;
    };

    const failedTestCases = await verifyTestCases();

    let submission_body = {
      u_id,
      p_id,
      c_id,
      language: lang,
      verdict: "failed",
      submitted_at: new Date(),
    };

    if (failedTestCases.length > 0) {
      await submission.create(submission_body);
      return res.status(200).json({
        success: false,
        message: "Some test cases failed!",
        failedTestCases,
      });
    } else {
      await submission.create({
        ...submission_body,
        verdict: "passed",
      });

      return res
        .status(200)
        .json({ success: true, message: "All test cases passed!" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

// codeRoutes.js
const express = require("express");
const { generateFile } = require("../generateFile");
const { generateInputFile } = require("../generateInputFile");
const { executeCpp } = require("../executeCpp");
const { generateOutputFile } = require("../generateOutputFile");
const { deleteFile } = require("../deleteFile");
const testcase = require("../models/TestCase");
const { submitCpp } = require("../submitCpp");

const router = express.Router();

router.post("/run", async (req, res) => {
  const { lang = "cpp", code, input } = req.body;

  if (code === undefined) {
    res.status(400).json({ success: false, error: "Empty code body!" });
  }
  const filePath = await generateFile(lang, code);
  const inputPath = await generateInputFile(input);
  const { outPath, jobId } = await generateOutputFile(filePath);
  const output = await executeCpp(filePath, inputPath, outPath, jobId);
  deleteFile(filePath);
  deleteFile(inputPath);
  deleteFile(outPath);
  res.status(200).json({ output });
});

router.post("/submit", async (req, res) => {
  const { lang = "cpp", code, id } = req.body;

  if (code === undefined) {
    res.status(400).json({ success: false, error: "Empty code body!" });
  }

  try {
    let filtered_testcase = await testcase.findOne({ p_id: id });

    const verifyTestCases = async () => {
      const failedTestCases = [];

      const promises = filtered_testcase.input.map(async (input, index) => {
        const output = filtered_testcase.output[index];
        const filePath = await generateFile(lang, code);
        const inputPath = await generateInputFile(input);
        const { outPath, jobId } = await generateOutputFile(filePath);
        const outputResult = await submitCpp(
          filePath,
          inputPath,
          outPath,
          jobId
        );

        if (outputResult.trim() !== output.trim()) {
          if (outputResult.trim() !== output.trim()) {
            failedTestCases.push({
              index: index + 1,
              expected: output,
              actual: outputResult.trim(),
            });
          }
        }

        deleteFile(inputPath);
      });

      await Promise.all(promises);
      return failedTestCases;
    };

    const failedTestCases = await verifyTestCases();

    if (failedTestCases.length > 0) {
      return res.status(200).json({
        success: false,
        message: "Some test cases failed!",
        failedTestCases,
      });
    } else {
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

// codeRoutes.js
const express = require("express");
const { generateFile } = require("../generateFile");
const { generateInputFile } = require("../generateInputFile");
const { executeCpp, executePython, executeJavaScript } = require("../executables/piston");
const { generateOutputFile } = require("../generateOutputFile");
const { deleteFile } = require("../deleteFile");
const testcase = require("../models/TestCase");
const { submitCpp } = require("../submitCpp");
const submission = require("../models/Submission");

const router = express.Router();

router.post("/run", async (req, res) => {
  const { lang = "cpp", code, input } = req.body;

  if (code === undefined) {
    res.status(400).json({ success: false, error: "Empty code body!" });
  }
  const filePath = await generateFile(lang, code);
  const inputPath = await generateInputFile(input);

  try {
    let output;
    if(lang === "cpp"){
      const { outPath } = await generateOutputFile(filePath);
      output = await executeCpp(filePath, inputPath);
      deleteFile(outPath);
    }else if(lang === "python"){
      output = await executePython(filePath, inputPath);
    }else if (lang === "javascript") {
      output = await executeJavaScript(filePath, inputPath);
    } else {
      return res
        .status(400)
        .json({ success: false, error: "Unsupported language!" });
    }

    deleteFile(filePath);
    deleteFile(inputPath);

    res.status(200).json({ output });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, error: e.error });
  }
});

router.post("/submit", async (req, res) => {
  const { lang = "cpp", code, p_id, u_id, c_id } = req.body;

  if (code === undefined) {
    res.status(400).json({ success: false, error: "Empty code body!" });
  }

  try {
    let filtered_testcase = await testcase.find({ p_id });    

    const verifyTestCases = async () => {
      const failedTestCases = [];
      const promises = filtered_testcase.map(async (testcase, index) => {
        const input = testcase["input"];
        const output = testcase["output"];
        const filePath = await generateFile(lang, code);
        const inputPath = await generateInputFile(input);

        let outputResult;
        if(lang === "cpp"){
           const { outPath, jobId } = await generateOutputFile(filePath);
           outputResult = await submitCpp(filePath, inputPath, outPath, jobId);
           deleteFile(outPath);
        }else if(lang === "python") {
          outputResult = await executePython(filePath, inputPath);
        } else if(lang === "javascript"){
          outputResult = await executeJavaScript(filePath, inputPath);
        }

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

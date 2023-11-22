// codeRoutes.js
const express = require("express");
const { generateFile } = require("../generateFile");
const { generateInputFile } = require("../generateInputFile");
const { executeCpp } = require("../executeCpp");
const { generateOutputFile } = require("../generateOutputFile");
const { deleteFile } = require("../deleteFile");

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
  const { lang = "cpp", code, input } = req.body;

  if (code === undefined) {
    res.status(400).json({ success: false, error: "Empty code body!" });
  }
  const filePath = await generateFile(lang, code);
  const inputPath = await generateInputFile(input);
  const { outPath, jobId } = await generateOutputFile(filePath);
  const output = await executeCpp(filePath, inputPath, outPath, jobId);
  res.status(200).json({ output });
});

module.exports = router;

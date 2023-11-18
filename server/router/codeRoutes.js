// codeRoutes.js
const express = require("express");
const { generateFile } = require("../generateFile");
const { generateInputFile } = require("../generateInputFile");
const { executeCpp } = require("../executeCpp");

const router = express.Router();

router.post("/run", async (req, res) => {
  const { lang = "cpp", code, input } = req.body;

  if (code === undefined) {
    res.status(400).json({ success: false, error: "Empty code body!" });
  }
  const filePath = await generateFile(lang, code);
  const inputPath = await generateInputFile(input);
  const output = await executeCpp(filePath, inputPath);
  res.status(200).json({ output, filePath, inputPath });
});

module.exports = router;

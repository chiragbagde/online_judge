const axios = require("axios");
const fs = require("fs");

function getVersionForLanguage(language) {
  const versions = {
    cpp: "10.2.0",
    python: "3.10.0",
    javascript: "18.15.0",
  };
  return versions[language] || "latest";
}


async function executeCode(language, code, input = "") {
  const version = getVersionForLanguage(language);
  const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
    language,
    version,
    files: [{ name: "main", content: code }],
    stdin: input,
  });

  return response.data.run.output;
}

async function executeCpp(filePath, inputPath) {
  const code = await fs.promises.readFile(filePath, "utf-8");
  const input = await fs.promises.readFile(inputPath, "utf-8");
  return executeCode("cpp", code, input);
}

async function executePython(filePath, inputPath) {
  const code = await fs.promises.readFile(filePath, "utf-8");
  const input = await fs.promises.readFile(inputPath, "utf-8");
  return executeCode("python", code, input);
}

async function executeJavaScript(filePath, inputPath) {
  const code = await fs.promises.readFile(filePath, "utf-8");
  const input = await fs.promises.readFile(inputPath, "utf-8");
  return executeCode("javascript", code, input);
}

module.exports = { executeCpp, executePython, executeJavaScript };
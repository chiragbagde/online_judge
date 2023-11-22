const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const outputPath = path.join(__dirname, "outputs");

const submitCpp = async (filePath, inputPath, outPath, jobId) => {
  const command = `g++ ${filePath} -o ${outPath} && cd ${outputPath} && .\\${jobId}.exe < ${inputPath}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderror) => {
      if (error) {
        reject({ error, stderror });
      }
      if (stderror) {
        reject(stderror);
      }
      resolve(stdout);
    });
  });
};

module.exports = {
  submitCpp,
};

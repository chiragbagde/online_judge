const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const outputPath = path.join(__dirname, "outputs");

const executeCpp = async (filePath, inputPath, outPath, jobId) => {
  return new Promise((resolve, reject) => {
    exec(
      `g++ ${filePath} -o ${outPath} && cd ${outputPath} && .\\${jobId}.exe`,
      (error, stdout, stderror) => {
        if (error) {
          reject({ error, stderror });
        }
        if (stderror) {
          reject(stderror);
        }
        resolve(stdout);
      }
    );
  });
};

module.exports = {
  executeCpp,
};

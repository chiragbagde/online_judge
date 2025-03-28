const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const outputPath = path.join(__dirname, "outputs");
const codePath = path.join(__dirname, "codes");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const executeCpp = async (filePath, inputPath) => {
  const jobId = path.basename(filePath).split(".")[0];
  const outPath = path.join(outputPath, `${jobId}.out`);

  return new Promise((resolve, reject) => {
    exec(
      `g++ ${filePath} -o ${outPath} && cd ${outputPath} && ./$(basename ${outPath}) < ${inputPath}`,
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

const executePython = async(filePath, inputPath) => {
  return new Promise((resolve, reject) => {
    exec(
      `python3 ${filePath} < ${inputPath}`,
      (error, stdout, stderror) => {
        if(error) {
          reject({error, stderror});
        }
        if(stderror){
          reject(stderror);
        }
        resolve(stdout);
      }
    )
  })
}

const executeJavaScript = async (filePath, inputPath) => {
  return new Promise((resolve, reject) => {
    exec(`node ${filePath} < ${inputPath}`, (error, stdout, stderror) => {
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
  executeCpp,
  executePython,
  executeJavaScript,
};

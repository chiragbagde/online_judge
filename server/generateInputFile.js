const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const dirInputs = path.join(__dirname, "inputs");

if (!fs.existsSync(dirInputs)) {
  fs.mkdirSync(dirInputs, { recursive: true });
}

const generateInputFile = async (input) => {
  const fileId = uuid();
  const filename = `${fileId}.txt`;
  const filePath = path.join(dirInputs, filename);
  await fs.writeFileSync(filePath, input);
  return filePath;
};

module.exports = {
  generateInputFile,
};

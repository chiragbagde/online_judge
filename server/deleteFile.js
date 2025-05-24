const fs = require("fs");

const deleteFile = (filePath) => {
  try {
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error(`Error deleting file: ${error.message}`);
      } else {
        console.log("File deleted successfully.", filePath);
      }
    });
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  deleteFile,
};

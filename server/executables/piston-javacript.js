const axios = require("axios");

async function executeJavaScript() {
  const code = `console.log(2+3)`;
  const input = "";

  const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
    language: "javascript",
    version: "18.15.0",
    files: [{ name: "main", content: code }],
    stdin: input,
  });

  console.log(response.data.run);
}

executeJavaScript();

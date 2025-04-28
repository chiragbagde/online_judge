const axios = require("axios");

async function getRuntimes() {
  const response = await axios.get("https://emkc.org/api/v2/piston/runtimes");
  console.log(response.data);
}

getRuntimes();

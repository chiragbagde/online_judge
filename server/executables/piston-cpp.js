const axios = require("axios");

async function executeCpp() {
  const code = `#include <iostream>
using namespace std;
int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`;
  const input = ""; // No input for this example

  const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
    language: "cpp",
    version: "10.2.0", // Change the version as needed
    files: [{ name: "main", content: code }],
    stdin: input,
  });

  console.log(response.data.run); // Logs the output of the code
}

executeCpp();

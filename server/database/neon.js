
require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.POSTGRES_URL);

const testNeonConnection = async () => {
  try {
    const result = await sql`SELECT version()`;
    console.log("✅ PostgreSQL connected:", result[0].version);
  } catch (err) {
    console.error("PostgreSQL connection error:", err.message);
  }
};

module.exports = { sql, testNeonConnection };

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Only needed with Render's *external* database URL
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

module.exports = pool;

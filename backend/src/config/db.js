const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  ssl: (process.env.DB_HOST === "localhost" || process.env.DB_HOST === "127.0.0.1")
    ? false
    : { rejectUnauthorized: false },
});

pool.connect()
  .then(() => {
    console.log("✅ PostgreSQL Connected");
  })
  .catch((err) => {
    console.error("❌ PostgreSQL Connection Error:");
    console.error(err);
  });

module.exports = pool;
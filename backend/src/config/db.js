const { Pool } = require("pg");

const isLocal = process.env.DB_HOST === "localhost" || process.env.DB_HOST === "127.0.0.1" || (!process.env.DB_HOST && !process.env.DATABASE_URL);

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

if (!isLocal) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.connect()
  .then(() => {
    console.log("✅ PostgreSQL Connected");
  })
  .catch((err) => {
    console.error("❌ PostgreSQL Connection Error:");
    console.error(err);
  });

module.exports = pool;
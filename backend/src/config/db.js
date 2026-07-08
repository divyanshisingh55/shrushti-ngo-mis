const { Pool } = require("pg");

let poolConfig;

if (process.env.DATABASE_URL) {
  // Railway / Neon: single connection string
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
} else {
  const isLocal =
    !process.env.DB_HOST ||
    process.env.DB_HOST === "localhost" ||
    process.env.DB_HOST === "127.0.0.1";

  poolConfig = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "Shrushti_mis",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  };
}

const pool = new Pool(poolConfig);

pool.connect()
  .then(client => {
    console.log("✅ PostgreSQL Connected Successfully");
    client.release();
  })
  .catch(err => {
    console.error("❌ PostgreSQL Connection Error:", err.message);
    console.error("   Server continues — set DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD");
  });

module.exports = pool;
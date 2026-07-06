const { Pool } = require("pg");

// Support both DATABASE_URL (connection string) and individual env vars
let poolConfig;
if (process.env.DATABASE_URL) {
    poolConfig = {
          connectionString: process.env.DATABASE_URL,
          ssl: {
                  rejectUnauthorized: false
          }
    };
} else {
    const isLocal = !process.env.DB_HOST || process.env.DB_HOST === "localhost" || process.env.DB_HOST === "127.0.0.1";
    poolConfig = {
          host: process.env.DB_HOST || "localhost",
          port: Number(process.env.DB_PORT || 5432),
          database: process.env.DB_NAME || "Shrushti_mis",
          user: process.env.DB_USER || "postgres",
          password: process.env.DB_PASSWORD || "",
          ...(isLocal ? {} : {
                  ssl: {
                            rejectUnauthorized: false
                  }
          })
    };
}

const pool = new Pool(poolConfig);

// Handle unexpected errors on idle clients to prevent crashes
pool.on("error", (err, client) => {
    console.error("Unexpected error on idle client:", err.message);
});

// Test connection on startup - log result but NEVER crash the server
pool.connect().then(client => {
    console.log("PostgreSQL Connected Successfully");
    client.release();
}).catch(err => {
    console.error("PostgreSQL Connection Failed:", err.message);
    console.error("Server will continue running but DB queries will fail.");
    console.error("Set DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD env vars.");
});

module.exports = pool;

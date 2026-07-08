require("dotenv").config();
const pool = require("./db");

async function runAllMigrations() {
  console.log("⚙️  Running Database Schema Migrations...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── users table ───────────────────────────────────────────────────────────
    console.log("- Verifying 'users' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id      SERIAL PRIMARY KEY,
        full_name    VARCHAR(255) NOT NULL,
        email        VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role         VARCHAR(50) DEFAULT 'User',
        phone        VARCHAR(20),
        designation  VARCHAR(100),
        department   VARCHAR(100),
        employee_id  VARCHAR(50),
        profile_photo TEXT,
        account_status VARCHAR(20) DEFAULT 'active',
        failed_login_attempts INT DEFAULT 0,
        lockout_until TIMESTAMP,
        last_login   TIMESTAMP,
        password_reset_token VARCHAR(255),
        password_reset_expiry TIMESTAMP,
        settings     JSONB DEFAULT '{}'::jsonb,
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add missing columns to users if upgrading existing DB
    const userColumns = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'User'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()"
    ];
    for (const sql of userColumns) {
      await client.query(sql).catch(() => {}); // Ignore if column already exists
    }

    // ── login_logs table ──────────────────────────────────────────────────────
    console.log("- Verifying 'login_logs' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        log_id       SERIAL PRIMARY KEY,
        user_id      INT REFERENCES users(user_id) ON DELETE SET NULL,
        name         VARCHAR(255),
        email        VARCHAR(255),
        login_time   TIMESTAMP DEFAULT NOW(),
        logout_time  TIMESTAMP,
        ip_address   VARCHAR(100),
        success      BOOLEAN NOT NULL,
        failure_reason TEXT,
        session_id   VARCHAR(255)
      );
    `);

    // ── user_sessions table ───────────────────────────────────────────────────
    console.log("- Verifying 'user_sessions' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id   SERIAL PRIMARY KEY,
        user_id      INT REFERENCES users(user_id) ON DELETE CASCADE,
        token_hash   VARCHAR(255) UNIQUE,
        ip           VARCHAR(100),
        device       VARCHAR(255),
        created_at   TIMESTAMP DEFAULT NOW(),
        expires_at   TIMESTAMP,
        last_active  TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── audit_logs table ──────────────────────────────────────────────────────
    console.log("- Verifying 'audit_logs' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id       SERIAL PRIMARY KEY,
        user_id      INT REFERENCES users(user_id) ON DELETE SET NULL,
        action       VARCHAR(100) NOT NULL,
        entity_type  VARCHAR(50),
        entity_id    INT,
        old_value    JSONB,
        new_value    JSONB,
        ip           VARCHAR(100),
        timestamp    TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Existing project tables (keep all existing migrations) ─────────────────
    console.log("- Verifying project tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS themes (
        theme_id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS agencies (
        agency_id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS statuses (
        status_id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    await client.query("COMMIT");
    console.log("✅ Database Schema Migrations Completed Successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Database Schema Migrations Failed:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { runAllMigrations };

require("dotenv").config();
const pool = require("./db");

async function runAllMigrations() {
  console.log("⚙️ Running Database Schema Migrations...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Extend the users table
    console.log("- Verifying 'users' table columns...");
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_device VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP;
    `);

    // 2. Create user_sessions table
    console.log("- Verifying 'user_sessions' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        ip VARCHAR(50),
        device VARCHAR(255),
        browser VARCHAR(100),
        os VARCHAR(100),
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );
    `);

    // 3. Create audit_logs table
    console.log("- Verifying 'audit_logs' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        log_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        action VARCHAR(100) NOT NULL,
        ip VARCHAR(50),
        device VARCHAR(255),
        details TEXT
      );
    `);

    // 4. Create login_logs table
    console.log("- Verifying 'login_logs' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        log_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
        name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logout_time TIMESTAMP,
        ip_address VARCHAR(50),
        browser VARCHAR(100),
        os VARCHAR(100),
        device_type VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Unknown',
        success BOOLEAN NOT NULL,
        failure_reason TEXT,
        session_id VARCHAR(255)
      );
    `);

    await client.query("COMMIT");
    console.log("✅ Database Schema Migrations Completed Successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Database Schema Migrations Failed:");
    console.error(error);
  } finally {
    client.release();
  }
}

module.exports = { runAllMigrations };

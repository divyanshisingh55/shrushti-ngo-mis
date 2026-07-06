const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../config/db");
const { generateTokens, authenticateToken, JWT_SECRET } = require("../middleware/auth");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");

const SALT_ROUNDS = 12;

// ─── Helper: log login attempt ────────────────────────────────────────────────
async function logLogin(userId, email, name, success, failureReason, req, sessionId = null) {
  try {
    const ua = req.headers["user-agent"] || "";
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";

    await pool.query(
      `INSERT INTO login_logs
        (user_id, name, email, ip_address, success, failure_reason, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, name, email, ip, success, failureReason, sessionId]
    );
  } catch (err) {
    console.error("Login log error:", err.message);
  }
}

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { fullName, email, password, phone, designation, department, employeeId, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email and password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    // Check if email exists
    const existing = await pool.query("SELECT user_id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Assign role — only 'Admin' or 'User'. First user becomes Admin if table is empty.
    const userCount = await pool.query("SELECT COUNT(*) FROM users");
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;

    let assignedRole = "User";
    if (isFirstUser) {
      assignedRole = "Admin"; // Bootstrap first user as Admin
    } else if (role === "Admin") {
      // Only admins can create other admins — checked later if needed
      assignedRole = "User"; // Default to User; admin upgrades via admin panel
    }

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, designation, department, employee_id, role, account_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW())
       RETURNING user_id, full_name, email, role`,
      [
        fullName.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        phone || null,
        designation || null,
        department || null,
        employeeId || null,
        assignedRole
      ]
    );

    const newUser = result.rows[0];

    // Auto-login: generate tokens
    const { accessToken } = generateTokens(newUser);

    res.status(201).json({
      message: "Registration successful.",
      token: accessToken,
      user: {
        user_id: newUser.user_id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      await logLogin(null, email, null, false, "User not found", req);
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];

    // Check account status
    if (user.account_status === "disabled") {
      await logLogin(user.user_id, email, user.full_name, false, "Account disabled", req);
      return res.status(403).json({ message: "Your account has been disabled. Contact your administrator." });
    }

    // Check lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      await logLogin(user.user_id, email, user.full_name, false, "Account locked", req);
      return res.status(429).json({
        message: `Account temporarily locked due to too many failed attempts. Try again in ${remaining} minute(s).`
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      // Increment failed attempts
      const newFailedCount = (user.failed_login_attempts || 0) + 1;
      const lockoutUntil = newFailedCount >= 5
        ? new Date(Date.now() + 15 * 60 * 1000)
        : null;

      await pool.query(
        "UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE user_id = $3",
        [newFailedCount, lockoutUntil, user.user_id]
      );

      await logLogin(user.user_id, email, user.full_name, false, "Wrong password", req);

      if (lockoutUntil) {
        return res.status(429).json({
          message: "Too many failed attempts. Account locked for 15 minutes."
        });
      }

      return res.status(401).json({
        message: `Invalid email or password. ${5 - newFailedCount} attempt(s) remaining.`
      });
    }

    // Success — reset failed attempts
    await pool.query(
      "UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login = NOW() WHERE user_id = $1",
      [user.user_id]
    );

    const { accessToken } = generateTokens(user);
    const sessionId = crypto.randomUUID();

    await logLogin(user.user_id, email, user.full_name, true, null, req, sessionId);

    res.json({
      message: "Login successful.",
      token: accessToken,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Update logout time in login_logs for this user's most recent session
    await pool.query(
      `UPDATE login_logs SET logout_time = NOW()
       WHERE user_id = $1 AND logout_time IS NULL
       ORDER BY login_time DESC LIMIT 1`,
      [req.user.user_id]
    );
    res.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed." });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name, email, role, phone, designation, department,
              employee_id, profile_photo, account_status, created_at, last_login
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user data." });
  }
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const result = await pool.query("SELECT user_id, full_name FROM users WHERE email = $1", [email.toLowerCase()]);

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: "If this email exists, you will receive a reset link." });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      "UPDATE users SET password_reset_token = $1, password_reset_expiry = $2 WHERE user_id = $3",
      [resetToken, expiry, user.user_id]
    );

    // In production: send email via nodemailer
    // For now, return token in response for development testing
    console.log(`Reset token for ${email}: ${resetToken}`);

    res.json({
      message: "If this email exists, you will receive a reset link.",
      // Remove in production — only for dev testing:
      dev_reset_token: process.env.NODE_ENV !== "production" ? resetToken : undefined
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to process request." });
  }
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const result = await pool.query(
      "SELECT user_id FROM users WHERE password_reset_token = $1 AND password_reset_expiry > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.query(
      "UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expiry = NULL WHERE user_id = $2",
      [passwordHash, result.rows[0].user_id]
    );

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password." });
  }
});

module.exports = router;

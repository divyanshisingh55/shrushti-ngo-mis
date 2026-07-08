const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../config/db");
const { generateTokens, authenticateToken } = require("../middleware/auth");
const { sendEmail } = require("../services/email");

const SALT_ROUNDS = 12;

// ─── Helper: log login attempt ─────────────────────────────────────────────────
async function logLogin(userId, email, name, success, failureReason, req, sessionId) {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    await pool.query(
      `INSERT INTO login_logs (user_id, name, email, ip_address, success, failure_reason, session_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId || null, name || null, email || null, ip, success, failureReason || null, sessionId || null]
    );
  } catch (err) {
    // Never crash on log failure
    console.error("Login log error:", err.message);
  }
}

// ─── POST /auth/register ───────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const {
      fullName, email, password,
      phone, designation, department, employeeId
    } = req.body || {};

    // ── Validation ──────────────────────────────────────────────────────────
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email and password are required." });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    // ── Check email uniqueness ──────────────────────────────────────────────
    const existingEmail = await pool.query(
      "SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // ── Check employee ID uniqueness ────────────────────────────────────────
    if (employeeId) {
      const existingEmpId = await pool.query(
        "SELECT user_id FROM users WHERE employee_id = $1",
        [employeeId.trim()]
      );
      if (existingEmpId.rows.length > 0) {
        return res.status(409).json({ message: "This Employee ID is already registered." });
      }
    }

    // ── Determine role — first user becomes Admin ───────────────────────────
    const countResult = await pool.query("SELECT COUNT(*) FROM users");
    const isFirstUser = parseInt(countResult.rows[0].count, 10) === 0;
    const assignedRole = isFirstUser ? "Admin" : "User";

    // ── Hash password ───────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Insert user ─────────────────────────────────────────────────────────
    const insertResult = await pool.query(
      `INSERT INTO users
         (full_name, email, password_hash, phone, designation, department,
          employee_id, role, account_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW())
       RETURNING user_id, full_name, email, role`,
      [
        fullName.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        phone?.trim() || null,
        designation?.trim() || null,
        department?.trim() || null,
        employeeId?.trim() || null,
        assignedRole
      ]
    );

    const newUser = insertResult.rows[0];

    // ── Generate JWT ─────────────────────────────────────────────────────────
    const { accessToken } = generateTokens(newUser);

    // ── Log registration as first login ──────────────────────────────────────
    const sessionId = crypto.randomUUID();
    await logLogin(newUser.user_id, newUser.email, newUser.full_name, true, null, req, sessionId);

    return res.status(201).json({
      message: isFirstUser
        ? "Registration successful. You are the admin."
        : "Registration successful.",
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
    return res.status(500).json({
      message: "Registration failed. Please try again.",
      detail: process.env.NODE_ENV !== "production" ? error.message : undefined
    });
  }
});

// ─── POST /auth/login ──────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );

    if (result.rows.length === 0) {
      await logLogin(null, email, null, false, "User not found", req, null);
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];

    // ── Account status check ────────────────────────────────────────────────
    if (user.account_status === "disabled") {
      await logLogin(user.user_id, email, user.full_name, false, "Account disabled", req, null);
      return res.status(403).json({ message: "Your account has been disabled. Contact your administrator." });
    }

    // ── Lockout check ───────────────────────────────────────────────────────
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const mins = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      await logLogin(user.user_id, email, user.full_name, false, "Account locked", req, null);
      return res.status(429).json({
        message: `Account locked due to too many failed attempts. Try again in ${mins} minute(s).`
      });
    }

    // ── Password check ──────────────────────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      const failedCount = (user.failed_login_attempts || 0) + 1;
      const lockoutUntil = failedCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await pool.query(
        "UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE user_id = $3",
        [failedCount, lockoutUntil, user.user_id]
      );
      await logLogin(user.user_id, email, user.full_name, false, "Wrong password", req, null);

      if (lockoutUntil) {
        return res.status(429).json({ message: "Too many failed attempts. Account locked for 15 minutes." });
      }
      return res.status(401).json({
        message: `Invalid email or password. ${5 - failedCount} attempt(s) remaining before lockout.`
      });
    }

    // ── Success ─────────────────────────────────────────────────────────────
    await pool.query(
      "UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login = NOW() WHERE user_id = $1",
      [user.user_id]
    );

    const { accessToken } = generateTokens(user);
    const sessionId = crypto.randomUUID();

    await logLogin(user.user_id, email, user.full_name, true, null, req, sessionId);

    return res.json({
      message: "Login successful.",
      token: accessToken,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Login failed. Please try again.",
      detail: process.env.NODE_ENV !== "production" ? error.message : undefined
    });
  }
});

// ─── POST /auth/logout ─────────────────────────────────────────────────────────
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `UPDATE login_logs SET logout_time = NOW()
       WHERE user_id = $1 AND logout_time IS NULL
       ORDER BY login_time DESC LIMIT 1`,
      [req.user.user_id]
    );
    return res.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Logout failed." });
  }
});

// ─── GET /auth/me ──────────────────────────────────────────────────────────────
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name, email, role, phone, designation,
              department, employee_id, account_status, created_at, last_login
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ message: "Failed to fetch user." });
  }
});

// ─── POST /auth/change-password ────────────────────────────────────────────────
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const result = await pool.query("SELECT password_hash FROM users WHERE user_id = $1", [req.user.user_id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found." });

    const match = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ message: "Current password is incorrect." });

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [hash, req.user.user_id]);

    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Failed to change password." });
  }
});

// ─── POST /auth/forgot-password ────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required." });

    const result = await pool.query(
      "SELECT user_id, full_name FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );

    // Always return same message — prevent email enumeration
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

    console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);

    // Send the actual email
    const resetUrl = `${req.headers.origin || "https://shrushti-ngo-mis.vercel.app"}/reset-password?token=${resetToken}`;
    try {
      await sendEmail({
        to: email.trim(),
        subject: "Password Reset Request - Shrushti MIS",
        text: `Hello ${user.full_name},\n\nYou requested a password reset for your Shrushti MIS account. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.\n\nIf you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #00897b; text-align: center;">Shrushti Seva Samiti</h2>
            <p>Hello <strong>${user.full_name}</strong>,</p>
            <p>You requested a password reset for your Shrushti MIS account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #00897b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p>This link is valid for 1 hour. If the button above doesn't work, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; color: #64748b;">${resetUrl}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center;">This is an automated email. Please do not reply.</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error("Failed to send reset email:", emailErr.message);
      // Do not return 500 error to user so we don't leak information, but log the error
    }

    return res.json({
      message: "If this email exists, you will receive a reset link.",
      dev_reset_token: process.env.NODE_ENV !== "production" ? resetToken : undefined
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Failed to process request." });
  }
});

// ─── POST /auth/reset-password ─────────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
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

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      "UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expiry = NULL, failed_login_attempts = 0, lockout_until = NULL WHERE user_id = $2",
      [hash, result.rows[0].user_id]
    );

    return res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Failed to reset password." });
  }
});

module.exports = router;

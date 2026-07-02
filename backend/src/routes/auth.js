const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");
const { sendEmail } = require("../services/email");
const { authenticateToken, JWT_SECRET } = require("../middleware/auth");

const SALT_ROUNDS = 10;
const SESSION_DURATION_HOURS = 24;

// Helper: parse basic User Agent info
function parseUserAgent(uaString) {
  let browser = "Other";
  let os = "Other";
  let device = "Desktop";

  if (!uaString) return { browser, os, device };
  const ua = uaString.toLowerCase();

  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("chrome") && !ua.includes("chromium")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edge")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  if (ua.includes("mobi") || ua.includes("android") || ua.includes("iphone")) {
    device = "Mobile";
  } else if (ua.includes("ipad") || ua.includes("tablet")) {
    device = "Tablet";
  }

  return { browser, os, device };
}

// Write helper for audit logs
async function logAuditEvent(userId, action, ip, device, details) {
  try {
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, ip, device, details) VALUES ($1, $2, $3, $4, $5)",
      [userId, action, ip, device, details]
    );
  } catch (err) {
    console.error("Audit log write error:", err);
  }
}

// 1. POST /register
router.post("/register", async (req, res) => {
  const { fullName, email, password, phone, designation, department, employeeId } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const deviceHeader = req.headers["user-agent"];

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "Full Name, Email, and Password are required." });
  }

  try {
    // Check if email already registered
    const userExist = await pool.query("SELECT user_id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // Check if first user in database
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");
    const count = parseInt(usersCount.rows[0].count);
    const assignedRole = count === 0 ? "Founder" : "Viewer"; // Auto-promote first user to Founder

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Insert user
    const newUser = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone, designation, department, employee_id, verification_token, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false) RETURNING user_id, full_name, email, role`,
      [fullName.trim(), email.toLowerCase().trim(), passwordHash, assignedRole, phone || null, designation || null, department || null, employeeId || null, verificationToken]
    );

    const userId = newUser.rows[0].user_id;

    // Send Verification Email
    const verificationLink = `${process.env.VITE_APP_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: email.toLowerCase().trim(),
      subject: "Verify your email - Shrushti MIS Portal",
      text: `Hello ${fullName},\n\nPlease verify your email by clicking the link: ${verificationLink}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0d9488;">Shrushti MIS Portal</h2>
          <p>Hello ${fullName},</p>
          <p>Please verify your email address to complete registration for the Shrushti Management Information System.</p>
          <div style="margin: 24px 0;">
            <a href="${verificationLink}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">If you didn't register for Shrushti MIS, please ignore this email.</p>
        </div>
      `
    });

    await logAuditEvent(userId, "USER_REGISTERED", ip, deviceHeader, `Assigned role: ${assignedRole}`);

    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// 2. POST /login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const { browser, os, device } = parseUserAgent(userAgent);

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = userRes.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Check verification status
    if (!user.email_verified) {
      return res.status(403).json({ message: "Please verify your email address before logging in." });
    }

    // Check active status
    if (!user.is_active || user.account_status !== "active") {
      return res.status(403).json({ message: "Your account is deactivated. Please contact an administrator." });
    }

    // Generate token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: `${SESSION_DURATION_HOURS}h` }
    );

    // Save session in database
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

    await pool.query(
      `INSERT INTO user_sessions (user_id, token_hash, ip, device, browser, os, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.user_id, tokenHash, ip, device, browser, os, expiresAt]
    );

    // Update last login details
    await pool.query(
      "UPDATE users SET last_login = NOW(), last_login_ip = $1, last_login_device = $2 WHERE user_id = $3",
      [ip, `${os} / ${browser}`, user.user_id]
    );

    await logAuditEvent(user.user_id, "USER_LOGIN_SUCCESS", ip, userAgent, `Logged in via ${browser} on ${os}`);

    res.json({
      token,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profile_photo,
        designation: user.designation,
        department: user.department,
        employeeId: user.employee_id
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// 3. POST /verify-email
router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "Verification token is required." });

  try {
    const userRes = await pool.query("SELECT user_id, full_name FROM users WHERE verification_token = $1", [token]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired verification token." });
    }

    const user = userRes.rows[0];
    await pool.query(
      "UPDATE users SET email_verified = true, email_verified_at = NOW(), verification_token = null WHERE user_id = $1",
      [user.user_id]
    );

    const ip = req.ip || req.connection.remoteAddress;
    await logAuditEvent(user.user_id, "EMAIL_VERIFIED", ip, req.headers["user-agent"], "Email address successfully verified.");

    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ message: "Server error during email verification." });
  }
});

// 4. POST /resend-verification
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email address is required." });

  try {
    const userRes = await pool.query("SELECT user_id, full_name, email_verified FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    const user = userRes.rows[0];
    if (user.email_verified) {
      return res.status(400).json({ message: "This email address is already verified." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    await pool.query("UPDATE users SET verification_token = $1 WHERE user_id = $2", [verificationToken, user.user_id]);

    const verificationLink = `${process.env.VITE_APP_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: email.toLowerCase().trim(),
      subject: "Verify your email - Shrushti MIS Portal",
      text: `Hello ${user.full_name},\n\nPlease verify your email by clicking the link: ${verificationLink}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0d9488;">Shrushti MIS Portal</h2>
          <p>Hello ${user.full_name},</p>
          <p>Please click the button below to verify your email address:</p>
          <div style="margin: 24px 0;">
            <a href="${verificationLink}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
          </div>
        </div>
      `
    });

    res.json({ message: "Verification link has been resent to your email address." });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ message: "Server error resending verification token." });
  }
});

// 5. POST /forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  try {
    const userRes = await pool.query("SELECT user_id, full_name FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      // Return 200/success anyway to prevent user enumeration security vulnerability
      return res.json({ message: "If that email is registered, we have sent a reset link." });
    }

    const user = userRes.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry

    await pool.query(
      "UPDATE users SET password_reset_token = $1, password_reset_expiry = $2 WHERE user_id = $3",
      [resetToken, resetExpiry, user.user_id]
    );

    const resetLink = `${process.env.VITE_APP_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email.toLowerCase().trim(),
      subject: "Reset your password - Shrushti MIS Portal",
      text: `Hello ${user.full_name},\n\nPlease reset your password via: ${resetLink}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0d9488;">Shrushti MIS Password Recovery</h2>
          <p>Hello ${user.full_name},</p>
          <p>We received a password reset request. Click the button below to configure your new secure password:</p>
          <div style="margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">This link will expire in 1 hour.</p>
        </div>
      `
    });

    res.json({ message: "If that email is registered, we have sent a reset link." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error generating reset token." });
  }
});

// 6. POST /reset-password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required." });
  }

  // Password policy check
  const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  if (!pwRegex.test(newPassword)) {
    return res.status(400).json({ 
      message: "Password must be at least 12 characters and include uppercase, lowercase, number, and special character." 
    });
  }

  try {
    const userRes = await pool.query(
      "SELECT user_id, password_hash FROM users WHERE password_reset_token = $1 AND password_reset_expiry > NOW()",
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: "Reset token is invalid or has expired." });
    }

    const user = userRes.rows[0];

    // Check that new password doesn't match the current hashed password
    const isSame = await bcrypt.compare(newPassword, user.password_hash);
    if (isSame) {
      return res.status(400).json({ message: "Cannot reuse your current password." });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.query(
      "UPDATE users SET password_hash = $1, password_reset_token = null, password_reset_expiry = null WHERE user_id = $2",
      [hashed, user.user_id]
    );

    const ip = req.ip || req.connection.remoteAddress;
    await logAuditEvent(user.user_id, "PASSWORD_RESET_SUCCESS", ip, req.headers["user-agent"], "Password successfully recovered and updated.");

    res.json({ message: "Password updated successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error resetting password." });
  }
});

// 7. POST /logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const crypto = require("crypto");
    const tokenHash = crypto.createHash("sha256").update(req.token).digest("hex");
    
    await pool.query("DELETE FROM user_sessions WHERE token_hash = $1", [tokenHash]);
    await logAuditEvent(req.user.user_id, "USER_LOGOUT", req.ip || req.connection.remoteAddress, req.headers["user-agent"], "Session terminated.");

    res.json({ message: "Successfully logged out." });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout." });
  }
});

module.exports = router;

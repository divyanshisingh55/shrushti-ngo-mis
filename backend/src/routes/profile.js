const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

const SALT_ROUNDS = 10;

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads/profile_photos");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "user-" + req.user.user_id + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpg, jpeg, png, gif) are allowed."));
  },
});

// Helper for audit logs
async function logAuditEvent(userId, action, ip, device, details) {
  try {
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, ip, device, details) VALUES ($1, $2, $3, $4, $5)",
      [userId, action, ip, device, details]
    );
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

// 1. GET /profile
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userRes = await pool.query(
      `SELECT user_id, full_name, email, role, phone, designation, department, employee_id, 
              profile_photo, email_verified, email_verified_at, last_login, last_login_ip, 
              last_login_device, account_status, settings, created_at 
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );
    res.json(userRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error retrieving profile." });
  }
});

// 2. PUT /profile
router.put("/", authenticateToken, async (req, res) => {
  const { fullName, phone, designation, department, settings } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    const currentRes = await pool.query("SELECT * FROM users WHERE user_id = $1", [req.user.user_id]);
    const current = currentRes.rows[0];

    // Read-only logic for core fields based on role:
    // Only Admin / Founder can update designation, department, employee_id.
    const isManager = req.user.role === "Admin" || req.user.role === "Founder" || req.user.role === "Super Admin";
    
    const finalDesignation = isManager ? (designation !== undefined ? designation : current.designation) : current.designation;
    const finalDepartment = isManager ? (department !== undefined ? department : current.department) : current.department;
    const finalSettings = settings !== undefined ? { ...current.settings, ...settings } : current.settings;

    await pool.query(
      `UPDATE users 
       SET full_name = $1, phone = $2, designation = $3, department = $4, settings = $5, updated_at = NOW() 
       WHERE user_id = $6`,
      [fullName || current.full_name, phone !== undefined ? phone : current.phone, finalDesignation, finalDepartment, JSON.stringify(finalSettings), req.user.user_id]
    );

    await logAuditEvent(req.user.user_id, "PROFILE_UPDATED", ip, req.headers["user-agent"], "Updated profile details.");

    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating profile." });
  }
});

// 3. POST /profile/photo
router.post("/photo", authenticateToken, upload.single("photo"), async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided." });
  }

  try {
    const userRes = await pool.query("SELECT profile_photo FROM users WHERE user_id = $1", [req.user.user_id]);
    const prevPhoto = userRes.rows[0].profile_photo;

    // Delete previous image file if it exists and is local
    if (prevPhoto && prevPhoto.startsWith("/uploads/")) {
      const fullPath = path.join(__dirname, "../..", prevPhoto);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (err) {
          console.error("Failed to delete previous profile photo:", err);
        }
      }
    }

    const photoUrl = `/uploads/profile_photos/${req.file.filename}`;
    await pool.query("UPDATE users SET profile_photo = $1 WHERE user_id = $2", [photoUrl, req.user.user_id]);
    await logAuditEvent(req.user.user_id, "PROFILE_PHOTO_UPDATED", ip, req.headers["user-agent"], "Uploaded new profile picture.");

    res.json({ message: "Profile photo updated successfully.", photoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error uploading photo." });
  }
});

// 4. PUT /profile/password (change password)
router.put("/password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new passwords are required." });
  }

  // Password policy check
  const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  if (!pwRegex.test(newPassword)) {
    return res.status(400).json({ 
      message: "Password must be at least 12 characters and include uppercase, lowercase, number, and special character." 
    });
  }

  try {
    const userRes = await pool.query("SELECT password_hash FROM users WHERE user_id = $1", [req.user.user_id]);
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    // Verify they are not reusing current password
    const isSame = await bcrypt.compare(newPassword, user.password_hash);
    if (isSame) {
      return res.status(400).json({ message: "New password cannot match your current password." });
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2", [hashed, req.user.user_id]);
    await logAuditEvent(req.user.user_id, "PASSWORD_CHANGED", ip, req.headers["user-agent"], "Security credentials updated.");

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error changing password." });
  }
});

// 5. GET /profile/sessions
router.get("/sessions", authenticateToken, async (req, res) => {
  try {
    const sessionsRes = await pool.query(
      `SELECT session_id, ip, device, browser, os, last_active, created_at, 
              (token_hash = $1) as is_current
       FROM user_sessions 
       WHERE user_id = $2 AND expires_at > NOW()
       ORDER BY last_active DESC`,
      [req.session.token_hash, req.user.user_id]
    );
    res.json(sessionsRes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error retrieving active sessions." });
  }
});

// 6. DELETE /profile/sessions (logout from all other devices or all devices)
router.delete("/sessions", authenticateToken, async (req, res) => {
  const { revokeAll } = req.body; // true = all sessions (including current), false = all other sessions
  const ip = req.ip || req.connection.remoteAddress;

  try {
    if (revokeAll) {
      await pool.query("DELETE FROM user_sessions WHERE user_id = $1", [req.user.user_id]);
      await logAuditEvent(req.user.user_id, "SESSIONS_REVOKED_ALL", ip, req.headers["user-agent"], "Terminated all active user sessions.");
    } else {
      await pool.query("DELETE FROM user_sessions WHERE user_id = $1 AND token_hash != $2", [req.user.user_id, req.session.token_hash]);
      await logAuditEvent(req.user.user_id, "SESSIONS_REVOKED_OTHERS", ip, req.headers["user-agent"], "Terminated other active user sessions.");
    }
    res.json({ message: "Sessions revoked successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error revoking sessions." });
  }
});

module.exports = router;

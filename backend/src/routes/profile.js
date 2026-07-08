const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

// PUT /profile/update
router.put("/update", authenticateToken, async (req, res) => {
  const { full_name, phone, designation, department } = req.body || {};

  try {
    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           designation = COALESCE($3, designation),
           department = COALESCE($4, department),
           updated_at = NOW()
       WHERE user_id = $5
       RETURNING user_id, full_name, email, role, phone, designation, department`,
      [full_name, phone, designation, department, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({
      message: "Profile updated successfully.",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile." });
  }
});

// GET /
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name, email, role, phone, designation, department,
              employee_id, account_status, created_at, last_login
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile." });
  }
});

module.exports = router;

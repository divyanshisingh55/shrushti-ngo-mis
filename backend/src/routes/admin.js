const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// All admin routes require authentication + admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /admin/users — list all users
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name, email, role, phone, designation, department,
              employee_id, account_status, created_at, last_login, failed_login_attempts
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

// GET /admin/users/:id — get single user with login history
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await pool.query(
      `SELECT user_id, full_name, email, role, phone, designation, department,
              employee_id, account_status, created_at, last_login
       FROM users WHERE user_id = $1`,
      [id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const logs = await pool.query(
      `SELECT log_id, login_time, logout_time, ip_address, success, failure_reason, session_id
       FROM login_logs
       WHERE user_id = $1
       ORDER BY login_time DESC
       LIMIT 50`,
      [id]
    );

    res.json({ user: user.rows[0], loginHistory: logs.rows });
  } catch (error) {
    console.error("Admin user detail error:", error);
    res.status(500).json({ message: "Failed to fetch user details." });
  }
});

// PATCH /admin/users/:id/status — enable or disable user
router.patch("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'disabled'

    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'disabled'." });
    }

    // Prevent disabling yourself
    if (parseInt(id) === req.user.user_id) {
      return res.status(400).json({ message: "You cannot disable your own account." });
    }

    await pool.query(
      "UPDATE users SET account_status = $1 WHERE user_id = $2",
      [status, id]
    );

    res.json({ message: `User account ${status === "active" ? "enabled" : "disabled"} successfully.` });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ message: "Failed to update user status." });
  }
});

// PATCH /admin/users/:id/role — change user role
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["Admin", "User", "Viewer", "Founder"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${validRoles.join(", ")}` });
    }

    if (parseInt(id) === req.user.user_id && role !== "Admin" && role !== "Founder") {
      return res.status(400).json({ message: "You cannot demote your own account." });
    }

    await pool.query("UPDATE users SET role = $1 WHERE user_id = $2", [role, id]);
    res.json({ message: "User role updated successfully." });
  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ message: "Failed to update role." });
  }
});

// DELETE /admin/users/:id — delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.user_id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user." });
  }
});

// POST /admin/users/:id/reset-password — admin reset user password
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE users SET password_hash = $1, failed_login_attempts = 0, lockout_until = NULL WHERE user_id = $2",
      [hash, id]
    );

    res.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Admin reset password error:", error);
    res.status(500).json({ message: "Failed to reset password." });
  }
});

// GET /admin/login-logs — all login history
router.get("/login-logs", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ll.*, u.full_name
       FROM login_logs ll
       LEFT JOIN users u ON ll.user_id = u.user_id
       ORDER BY ll.login_time DESC
       LIMIT 200`
    );
    res.json({ logs: result.rows });
  } catch (error) {
    console.error("Login logs error:", error);
    res.status(500).json({ message: "Failed to fetch login logs." });
  }
});

// GET /admin/stats — admin dashboard metrics
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await pool.query("SELECT COUNT(*) FROM users");
    const activeUsers = await pool.query("SELECT COUNT(*) FROM users WHERE account_status = 'active'");
    const disabledUsers = await pool.query("SELECT COUNT(*) FROM users WHERE account_status = 'disabled'");
    const totalLogins = await pool.query("SELECT COUNT(*) FROM login_logs WHERE success = true");
    const failedLogins = await pool.query("SELECT COUNT(*) FROM login_logs WHERE success = false");
    const recentLogins = await pool.query(
      `SELECT ll.login_time, ll.ip_address, ll.success, u.full_name, u.email
       FROM login_logs ll
       LEFT JOIN users u ON ll.user_id = u.user_id
       ORDER BY ll.login_time DESC LIMIT 10`
    );

    res.json({
      stats: {
        total_users: parseInt(totalUsers.rows[0].count),
        active_users: parseInt(activeUsers.rows[0].count),
        disabled_users: parseInt(disabledUsers.rows[0].count),
        total_logins: parseInt(totalLogins.rows[0].count),
        failed_logins: parseInt(failedLogins.rows[0].count)
      },
      recent_logins: recentLogins.rows
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Failed to fetch admin stats." });
  }
});

module.exports = router;

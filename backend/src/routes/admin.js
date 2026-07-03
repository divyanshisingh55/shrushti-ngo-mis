const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Protect all admin endpoints with authentication and Founder/Admin role restrictions
router.use(authenticateToken);
router.use(requireRole(["Founder", "Admin"]));

// 1. GET /admin/stats - Retrieve system stats
router.get("/stats", async (req, res) => {
  try {
    const totalUsersRes = await pool.query("SELECT COUNT(*) FROM users");
    const activeUsersRes = await pool.query("SELECT COUNT(*) FROM users WHERE account_status = 'active'");
    
    // Online: Sessions that have not expired and have been active in the last 15 minutes
    const onlineUsersRes = await pool.query(`
      SELECT COUNT(DISTINCT user_id) 
      FROM user_sessions 
      WHERE expires_at > NOW() AND last_active > NOW() - INTERVAL '15 minutes'
    `);
    
    const failedLoginsRes = await pool.query("SELECT COUNT(*) FROM login_logs WHERE success = false");

    res.json({
      totalUsers: parseInt(totalUsersRes.rows[0].count),
      activeUsers: parseInt(activeUsersRes.rows[0].count),
      onlineUsers: parseInt(onlineUsersRes.rows[0].count),
      failedLogins: parseInt(failedLoginsRes.rows[0].count)
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Server error fetching administrative stats." });
  }
});

// 2. GET /admin/users - List and filter users
router.get("/users", async (req, res) => {
  const { search, role, status } = req.query;
  const params = [];
  let queryText = `
    SELECT user_id, full_name, email, role, phone, designation, department, employee_id, last_login, account_status, created_at 
    FROM users
    WHERE 1=1
  `;

  if (search) {
    params.push(`%${search.trim().toLowerCase()}%`);
    queryText += ` AND (LOWER(full_name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(designation) LIKE $${params.length})`;
  }

  if (role) {
    params.push(role);
    queryText += ` AND role = $${params.length}`;
  }

  if (status) {
    params.push(status);
    queryText += ` AND account_status = $${params.length}`;
  }

  queryText += " ORDER BY created_at DESC";

  try {
    const usersRes = await pool.query(queryText, params);
    res.json(usersRes.rows);
  } catch (err) {
    console.error("Admin list users error:", err);
    res.status(500).json({ message: "Server error listing users." });
  }
});

// 3. PUT /admin/users/:userId/status - Change account status or role
router.put("/users/:userId/status", async (req, res) => {
  const { userId } = req.params;
  const { status, role } = req.body;

  // Prevent users from deactivating themselves
  if (parseInt(userId) === req.user.user_id && status === "deactivated") {
    return res.status(400).json({ message: "You cannot deactivate your own account." });
  }

  // Prevent modifying critical Founders unless the editor is a Founder
  try {
    const targetUser = await pool.query("SELECT role FROM users WHERE user_id = $1", [userId]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ message: "Target user not found." });
    }

    if (targetUser.rows[0].role === "Founder" && req.user.role !== "Founder") {
      return res.status(403).json({ message: "Only Founders can modify another Founder's details." });
    }

    const updates = [];
    const params = [userId];

    if (status) {
      params.push(status);
      updates.push(`account_status = $${params.length}`);
    }

    if (role) {
      params.push(role);
      updates.push(`role = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No update parameters provided." });
    }

    const queryText = `
      UPDATE users 
      SET ${updates.join(", ")}, updated_at = NOW() 
      WHERE user_id = $1 
      RETURNING user_id, full_name, email, role, account_status
    `;

    const result = await pool.query(queryText, params);
    
    // Revoke sessions if deactivating
    if (status === "deactivated") {
      await pool.query("DELETE FROM user_sessions WHERE user_id = $1", [userId]);
    }

    res.json({
      message: "User status updated successfully.",
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Update user status error:", err);
    res.status(500).json({ message: "Server error changing user status." });
  }
});

// 4. GET /admin/login-logs - View detailed login history
router.get("/login-logs", async (req, res) => {
  const { search, success, limit = 100, offset = 0 } = req.query;
  const params = [];
  let queryText = `
    SELECT log_id, user_id, name, email, login_time, logout_time, ip_address, browser, os, device_type, country, success, failure_reason
    FROM login_logs
    WHERE 1=1
  `;

  if (search) {
    params.push(`%${search.trim().toLowerCase()}%`);
    queryText += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(ip_address) LIKE $${params.length})`;
  }

  if (success !== undefined && success !== "") {
    params.push(success === "true");
    queryText += ` AND success = $${params.length}`;
  }

  queryText += " ORDER BY login_time DESC";

  // Add pagination limits
  params.push(parseInt(limit));
  queryText += ` LIMIT $${params.length}`;
  
  params.push(parseInt(offset));
  queryText += ` OFFSET $${params.length}`;

  try {
    const logsRes = await pool.query(queryText, params);
    
    // Get count for pagination
    let countQuery = "SELECT COUNT(*) FROM login_logs WHERE 1=1";
    const countParams = [];
    if (search) {
      countParams.push(`%${search.trim().toLowerCase()}%`);
      countQuery += ` AND (LOWER(name) LIKE $1 OR LOWER(email) LIKE $1 OR LOWER(ip_address) LIKE $1)`;
    }
    if (success !== undefined && success !== "") {
      countParams.push(success === "true");
      countQuery += ` AND success = $${countParams.length}`;
    }
    const countRes = await pool.query(countQuery, countParams);

    res.json({
      logs: logsRes.rows,
      totalCount: parseInt(countRes.rows[0].count)
    });
  } catch (err) {
    console.error("Admin login-logs error:", err);
    res.status(500).json({ message: "Server error fetching login logs." });
  }
});

module.exports = router;

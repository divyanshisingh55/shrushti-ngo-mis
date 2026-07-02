const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "shrushti_mis_super_secure_key_123";

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No authentication token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Hash token to verify session
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const sessionRes = await pool.query(
      "SELECT * FROM user_sessions WHERE token_hash = $1 AND expires_at > NOW()",
      [tokenHash]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(401).json({ message: "Session expired or revoked." });
    }

    // Load active user details
    const userRes = await pool.query(
      "SELECT user_id, full_name, email, role, is_active, account_status, email_verified FROM users WHERE user_id = $1",
      [decoded.user_id]
    );

    if (userRes.rows.length === 0) {
      return res.status(403).json({ message: "User account not found." });
    }

    const user = userRes.rows[0];

    if (!user.is_active || user.account_status !== "active") {
      return res.status(403).json({ message: "Your account is deactivated or suspended." });
    }

    // Attach user and session to request
    req.user = user;
    req.session = sessionRes.rows[0];
    req.token = token;

    // Asynchronously update last_active timestamp
    pool.query(
      "UPDATE user_sessions SET last_active = NOW() WHERE session_id = $1",
      [req.session.session_id]
    ).catch(err => console.error("Session update error:", err));

    next();
  } catch (err) {
    console.error("JWT Verification error:", err);
    return res.status(401).json({ message: "Session expired or invalid token." });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole, JWT_SECRET };

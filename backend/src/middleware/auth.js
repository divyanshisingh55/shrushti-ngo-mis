const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "shrushti_dev_secret_change_in_production";

/**
 * Middleware: Verify JWT token from Authorization header.
 * Attaches decoded user to req.user on success.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required. Please log in." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
      return res.status(403).json({ message: "Invalid token. Please log in again." });
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware: Require Admin or Founder role.
 * Must be used after authenticateToken.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }
  if (req.user.role !== "Admin" && req.user.role !== "Founder") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

/**
 * Generate access token (24h) and refresh token (7d)
 */
function generateTokens(user) {
  const payload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  const refreshToken = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: "7d" });

  return { accessToken, refreshToken };
}

module.exports = { authenticateToken, requireAdmin, generateTokens, JWT_SECRET };

const rateLimit = require("express-rate-limit");

// Strict login limiter: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    message: "Too many failed login attempts. Your IP has been temporarily locked for 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API limiter: 200 req/min per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false
});

// Registration limiter: 10 per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Too many registration attempts from this IP." },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { loginLimiter, apiLimiter, registerLimiter };

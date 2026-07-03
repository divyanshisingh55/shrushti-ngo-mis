// Vercel serverless entry point
// At build time, copy-backend.js copies backend/src → frontend/server
// So this function can require the Express app at runtime
const app = require("../server/app");

module.exports = app;

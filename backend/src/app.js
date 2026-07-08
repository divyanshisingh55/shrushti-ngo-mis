require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const pool = require("./config/db");
const { runAllMigrations } = require("./config/migrations");

// Routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");
const projectRoutes = require("./routes/projects");
const themeRoutes = require("./routes/themes");
const dashboardRoutes = require("./routes/dashboard");
const projectDetailsRoutes = require("./routes/projectDetails");
const subThemeRoutes = require("./routes/subthemes");
const targetGroupRoutes = require("./routes/targetgroups");
const activityTypeRoutes = require("./routes/activitytypes");
const classifyProjectRoutes = require("./routes/classifyProject");
const agencyRoutes = require("./routes/agencies");
const fundingSourceRoutes = require("./routes/fundingsources");
const statusRoutes = require("./routes/statuses");
const stateRoutes = require("./routes/states");
const reportsRoutes = require("./routes/reports");
const aiClassificationRoutes = require("./routes/aiClassification");
const districtRoutes = require("./routes/districts");
const blockRoutes = require("./routes/blocks");
const sdgRoutes = require("./routes/sdgs");
const taxonomyRoutes = require("./routes/taxonomy");
const financeRoutes = require("./routes/finance");

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.endsWith(".vercel.app") ||
      origin === "https://shrushti-ngo-mis.vercel.app"
    ) {
      return callback(null, true);
    }
    // Log but allow unknown origins in dev to simplify debugging
    console.warn("CORS origin not in whitelist:", origin);
    return callback(null, true); // permissive for now
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));
app.options(/^(.*)$/, cors());

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/admin", adminRoutes);
app.use("/projects", projectRoutes);
app.use("/themes", themeRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/project", projectDetailsRoutes);
app.use("/subthemes", subThemeRoutes);
app.use("/targetgroups", targetGroupRoutes);
app.use("/activitytypes", activityTypeRoutes);
app.use("/classifyProject", classifyProjectRoutes);
app.use("/classify-project", classifyProjectRoutes);
app.use("/agencies", agencyRoutes);
app.use("/fundingsources", fundingSourceRoutes);
app.use("/statuses", statusRoutes);
app.use("/states", stateRoutes);
app.use("/reports", reportsRoutes);
app.use("/ai-classify", aiClassificationRoutes);
app.use("/districts", districtRoutes);
app.use("/blocks", blockRoutes);
app.use("/sdgs", sdgRoutes);
app.use("/taxonomy", taxonomyRoutes);
app.use("/finance", financeRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      database_connected: true,
      time: result.rows[0].now,
      branch: process.env.GIT_BRANCH || "unknown",
      routes: ["/auth", "/admin", "/projects", "/dashboard", "/finance"]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Global JSON error handler (Express v5: catches body parser errors) ─────────
app.use((err, req, res, next) => {
  // Body parser syntax error → return JSON 400 not HTML
  if (err.type === "entity.parse.failed" || err.status === 400) {
    return res.status(400).json({ message: "Invalid JSON in request body." });
  }
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error." });
});

// ── Startup ───────────────────────────────────────────────────────────────────
runAllMigrations().catch(err => {
  console.error("Startup migrations failed:", err.message);
});
function printRoutes(app) {
  const routerPrefixes = new Map([
    [authRoutes, "/auth"],
    [profileRoutes, "/profile"],
    [adminRoutes, "/admin"],
    [projectRoutes, "/projects"],
    [themeRoutes, "/themes"],
    [dashboardRoutes, "/dashboard"],
    [projectDetailsRoutes, "/project"],
    [subThemeRoutes, "/subthemes"],
    [targetGroupRoutes, "/targetgroups"],
    [activityTypeRoutes, "/activitytypes"],
    [classifyProjectRoutes, "/classifyProject"],
    [agencyRoutes, "/agencies"],
    [fundingSourceRoutes, "/fundingsources"],
    [statusRoutes, "/statuses"],
    [stateRoutes, "/states"],
    [reportsRoutes, "/reports"],
    [aiClassificationRoutes, "/ai-classify"],
    [districtRoutes, "/districts"],
    [blockRoutes, "/blocks"],
    [sdgRoutes, "/sdgs"],
    [taxonomyRoutes, "/taxonomy"],
    [financeRoutes, "/finance"]
  ]);

  const routes = [];

  if (app.router && app.router.stack) {
    app.router.stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
        routes.push(`${methods.join(", ")} ${layer.route.path}`);
      } else if (layer.handle && layer.handle.stack) {
        const prefix = routerPrefixes.get(layer.handle) || "/unknown";
        layer.handle.stack.forEach(subLayer => {
          if (subLayer.route) {
            const methods = Object.keys(subLayer.route.methods).map(m => m.toUpperCase());
            routes.push(`${methods.join(", ")} ${prefix}${subLayer.route.path}`);
          }
        });
      }
    });
  }

  console.log("=== REGISTERED ROUTES ===");
  routes.forEach(r => console.log("Route:", r));
  console.log("=========================");
}
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Shrushti MIS Backend running on port ${PORT}`);
  console.log("Auth routes: /auth/register, /auth/login, /auth/logout, /auth/me");
  printRoutes(app);
});

module.exports = app;
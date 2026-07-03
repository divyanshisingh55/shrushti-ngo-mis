require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
require("dotenv").config(); // fallback to cwd .env

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/db");
const { runAllMigrations } = require("./config/migrations");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
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
const adminRoutes = require("./routes/admin");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    // Allow localhost on any port for dev
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }
    // Allow any Vercel deployment
    if (origin.endsWith(".vercel.app") || origin === "https://shrushti-ngo-mis.vercel.app") {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.options("*", cors()); // handle preflight

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── ROUTES ────────────────────────────────────────────────────────────────────
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

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, database_connected: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── START ──────────────────────────────────────────────────────────────────────
// Run migrations in background — never block server startup
runAllMigrations().catch(err => {
  console.error("❌ Startup migrations failed:", err.message);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Shrushti MIS Backend running on port ${PORT}`);
});

module.exports = app;
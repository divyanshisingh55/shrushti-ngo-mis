console.log("APP STARTING...");
require("dotenv").config();

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "Loaded" : "Not Loaded");

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

const projectRoutes = require("./routes/projects");
const themeRoutes = require("./routes/themes");
const pool = require("./config/db");
const dashboardRoutes = require("./routes/dashboard");
const app = express();
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
const { runAllMigrations } = require("./config/migrations");

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://shrushti-ngo-mis.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Allow matching origins or any vercel subdomain
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
const baseRouter = express.Router();

baseRouter.use("/auth", authRoutes);
baseRouter.use("/profile", profileRoutes);
baseRouter.use("/admin", adminRoutes);
baseRouter.use("/projects", projectRoutes);
baseRouter.use("/themes", themeRoutes);
baseRouter.use("/dashboard", dashboardRoutes);
baseRouter.use("/project", projectDetailsRoutes);
baseRouter.use("/subthemes", subThemeRoutes);
baseRouter.use("/targetgroups", targetGroupRoutes);
baseRouter.use("/activitytypes", activityTypeRoutes);
baseRouter.use("/classifyProject", classifyProjectRoutes);
baseRouter.use("/classify-project", classifyProjectRoutes);
baseRouter.use("/agencies", agencyRoutes);
baseRouter.use("/fundingsources", fundingSourceRoutes);
baseRouter.use("/statuses", statusRoutes);
baseRouter.use("/states", stateRoutes);
baseRouter.use("/reports", reportsRoutes);
baseRouter.use("/ai-classify", aiClassificationRoutes);
baseRouter.use("/districts", districtRoutes);
baseRouter.use("/blocks", blockRoutes);
baseRouter.use("/sdgs", sdgRoutes);
baseRouter.use("/taxonomy", taxonomyRoutes);
baseRouter.use("/finance", financeRoutes);

baseRouter.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      database_connected: true,
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("DATABASE ERROR:");
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.use("/api", baseRouter);
app.use("/", baseRouter);

// Run migrations in background on boot
runAllMigrations().catch(err => {
  console.error("❌ Startup migrations failed:", err);
});

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Shrushti MIS Backend Running On Port ${PORT}`);
  });
}

module.exports = app;
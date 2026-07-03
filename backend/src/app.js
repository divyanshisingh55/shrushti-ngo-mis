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

app.get("/", async (req, res) => {
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Shrushti MIS Backend Running On Port ${PORT}`);
  
  // Run database migrations in the background so slow connection handshakes do not block boot checks
  runAllMigrations().catch(err => {
    console.error("❌ Startup migrations failed:", err);
  });
});
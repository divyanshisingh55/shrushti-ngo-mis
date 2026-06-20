console.log("APP STARTING...");
require("dotenv").config();

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "Loaded" : "Not Loaded");

const express = require("express");
const cors = require("cors");

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

app.use(cors());
app.use(express.json());
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

app.listen(5000, () => {
  console.log("🚀 Shrushti MIS Backend Running On Port 5000");
});
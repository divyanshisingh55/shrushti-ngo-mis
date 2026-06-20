const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/summary", async (req, res) => {
  try {
    const totalProjects = await pool.query(`
      SELECT COUNT(*) FROM projects
    `);

    const pendingProjects = await pool.query(`
      SELECT COUNT(*)
      FROM projects
      WHERE classification_status = 'Pending'
    `);

    const completedProjects = await pool.query(`
      SELECT COUNT(*)
      FROM projects
      WHERE classification_status = 'Completed'
    `);

    res.json({
      totalProjects: Number(totalProjects.rows[0].count),
      pendingProjects: Number(pendingProjects.rows[0].count),
      completedProjects: Number(completedProjects.rows[0].count)
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

router.get("/charts", async (req, res) => {
  try {
    // 1. Projects by Theme (Primary Theme)
    const themeRes = await pool.query(`
      SELECT t.theme_name, COUNT(p.project_id)::integer as count
      FROM projects p
      JOIN project_themes pt ON p.project_id = pt.project_id AND pt.primary_flag = true
      JOIN themes t ON pt.theme_id = t.theme_id
      GROUP BY t.theme_name
      ORDER BY count DESC
    `);

    // 2. Projects by Year
    const yearRes = await pool.query(`
      SELECT p.year, COUNT(p.project_id)::integer as count
      FROM projects p
      WHERE p.year IS NOT NULL AND p.year <> ''
      GROUP BY p.year
      ORDER BY p.year ASC
    `);

    // 3. Projects by Agency (Top 10)
    const agencyRes = await pool.query(`
      SELECT a.agency_name, COUNT(p.project_id)::integer as count
      FROM projects p
      JOIN agencies a ON p.agency_id = a.agency_id
      GROUP BY a.agency_name
      ORDER BY count DESC
      LIMIT 10
    `);

    // 4. Projects by State
    const stateRes = await pool.query(`
      SELECT s.state_name, COUNT(p.project_id)::integer as count
      FROM projects p
      JOIN states s ON p.state_id = s.state_id
      GROUP BY s.state_name
      ORDER BY count DESC
    `);

    res.json({
      projectsByTheme: themeRes.rows,
      projectsByYear: yearRes.rows,
      projectsByAgency: agencyRes.rows,
      projectsByState: stateRes.rows
    });
  } catch (error) {
    console.error("Dashboard Charts Error:", error);
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;
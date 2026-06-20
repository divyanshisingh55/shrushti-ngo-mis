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

module.exports = router;
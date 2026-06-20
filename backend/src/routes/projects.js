const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/*
=========================================
GET ALL PROJECTS WITH FILTERS
=========================================
Examples:

/projects
/projects?year=2025
/projects?status=Pending
/projects?search=education
/projects?year=2025&status=Pending
=========================================
*/

router.get("/", async (req, res) => {
  try {

    const { year, status, search } = req.query;

    let query = `
      SELECT
        project_id,
        doc_no,
        project_name,
        year,
        approval_date,
        sanctioned_amount,
        classification_status
      FROM projects
      WHERE 1 = 1
    `;

    const values = [];
    let paramCount = 1;

    // Year Filter
    if (year) {
      query += ` AND year = $${paramCount}`;
      values.push(year);
      paramCount++;
    }

    // Status Filter
    if (status) {
      query += ` AND classification_status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    // Search Filter
    if (search) {
      query += ` AND project_name ILIKE $${paramCount}`;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY project_id DESC`;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {

    console.error("Projects Fetch Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});

module.exports = router;
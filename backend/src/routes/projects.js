const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Helper function to resolve or create agency
async function getOrCreateAgency(agency) {
  if (!agency) return null;
  if (!isNaN(agency) && Number.isInteger(Number(agency))) {
    return Number(agency);
  }
  const name = String(agency).trim();
  const res = await pool.query("SELECT agency_id FROM agencies WHERE agency_name = $1", [name]);
  if (res.rows.length > 0) {
    return res.rows[0].agency_id;
  }
  const insertRes = await pool.query(
    "INSERT INTO agencies (agency_name) VALUES ($1) RETURNING agency_id",
    [name]
  );
  return insertRes.rows[0].agency_id;
}

// Helper function to resolve or create funding source
async function getOrCreateFunding(funding) {
  if (!funding) return null;
  if (!isNaN(funding) && Number.isInteger(Number(funding))) {
    return Number(funding);
  }
  const name = String(funding).trim();
  const res = await pool.query("SELECT funding_source_id FROM funding_sources WHERE source_name = $1", [name]);
  if (res.rows.length > 0) {
    return res.rows[0].funding_source_id;
  }
  const insertRes = await pool.query(
    "INSERT INTO funding_sources (source_name) VALUES ($1) RETURNING funding_source_id",
    [name]
  );
  return insertRes.rows[0].funding_source_id;
}

// Helper function to resolve or create state
async function getOrCreateState(state) {
  if (!state) return null;
  if (!isNaN(state) && Number.isInteger(Number(state))) {
    return Number(state);
  }
  const name = String(state).trim();
  const res = await pool.query("SELECT state_id FROM states WHERE state_name = $1", [name]);
  if (res.rows.length > 0) {
    return res.rows[0].state_id;
  }
  const insertRes = await pool.query(
    "INSERT INTO states (state_name) VALUES ($1) RETURNING state_id",
    [name]
  );
  return insertRes.rows[0].state_id;
}

/*
=========================================
GET ALL PROJECTS WITH FILTERS & METADATA
=========================================
*/
router.get("/", async (req, res) => {
  try {
    const { year, status, search, agency_id, theme_id } = req.query;

    let query = `
      SELECT
        p.project_id,
        p.doc_no,
        p.project_name,
        p.year,
        p.approval_date,
        p.sanctioned_amount,
        p.classification_status,
        a.agency_name,
        s.state_name
      FROM projects p
      LEFT JOIN agencies a ON p.agency_id = a.agency_id
      LEFT JOIN states s ON p.state_id = s.state_id
    `;

    // If filtering by primary theme, we need to join project_themes
    if (theme_id) {
      query += ` JOIN project_themes pt ON p.project_id = pt.project_id AND pt.primary_flag = true AND pt.theme_id = $1`;
    }

    query += ` WHERE 1 = 1`;

    const values = [];
    let paramCount = theme_id ? 2 : 1;
    if (theme_id) {
      values.push(Number(theme_id));
    }

    // Year Filter
    if (year) {
      query += ` AND p.year = $${paramCount}`;
      values.push(year);
      paramCount++;
    }

    // Status Filter
    if (status) {
      query += ` AND p.classification_status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    // Agency Filter
    if (agency_id) {
      query += ` AND p.agency_id = $${paramCount}`;
      values.push(Number(agency_id));
      paramCount++;
    }

    // Search Filter
    if (search) {
      query += ` AND p.project_name ILIKE $${paramCount}`;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY p.project_id DESC`;

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

/*
=========================================
CREATE NEW PROJECT
=========================================
*/
router.post("/", async (req, res) => {
  const {
    project_name,
    agency,
    year,
    funding_source,
    approval_date,
    sanctioned_amount,
    status_id,
    state,
    remarks
  } = req.body;

  if (!project_name) {
    return res.status(400).json({ success: false, message: "Project name is required" });
  }

  try {
    const agencyId = await getOrCreateAgency(agency);
    const fundingSourceId = await getOrCreateFunding(funding_source);
    const stateId = await getOrCreateState(state);

    const result = await pool.query(
      `INSERT INTO projects (
        project_name, agency_id, year, funding_source_id, approval_date,
        sanctioned_amount, status_id, state_id, remarks, classification_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')
      RETURNING *`,
      [
        project_name,
        agencyId,
        year || null,
        fundingSourceId,
        approval_date ? approval_date : null,
        sanctioned_amount ? Number(sanctioned_amount) : null,
        status_id ? Number(status_id) : null,
        stateId,
        remarks || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Create Project Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/*
=========================================
UPDATE PROJECT DETAILS
=========================================
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    project_name,
    agency,
    year,
    funding_source,
    approval_date,
    sanctioned_amount,
    status_id,
    state,
    remarks
  } = req.body;

  if (!project_name) {
    return res.status(400).json({ success: false, message: "Project name is required" });
  }

  try {
    const agencyId = await getOrCreateAgency(agency);
    const fundingSourceId = await getOrCreateFunding(funding_source);
    const stateId = await getOrCreateState(state);

    const result = await pool.query(
      `UPDATE projects 
       SET project_name = $1, agency_id = $2, year = $3, funding_source_id = $4,
           approval_date = $5, sanctioned_amount = $6, status_id = $7, state_id = $8,
           remarks = $9, updated_at = NOW()
       WHERE project_id = $10
       RETURNING *`,
      [
        project_name,
        agencyId,
        year || null,
        fundingSourceId,
        approval_date ? approval_date : null,
        sanctioned_amount ? Number(sanctioned_amount) : null,
        status_id ? Number(status_id) : null,
        stateId,
        remarks || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.json({
      success: true,
      message: "Project updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Update Project Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/*
=========================================
DELETE PROJECT
=========================================
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM projects WHERE project_id = $1 RETURNING project_id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    res.json({
      success: true,
      message: "Project deleted successfully",
      projectId: id
    });
  } catch (error) {
    console.error("Delete Project Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
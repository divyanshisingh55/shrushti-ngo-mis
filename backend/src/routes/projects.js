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
    const {
      year,
      status, // classification_status
      search, // project_name ILIKE
      agency_id,
      theme_id,
      doc_no,
      approval_date_start,
      approval_date_end,
      funding_source_id,
      state_id,
      district_id,
      block_id,
      status_id, // implementation status_id
      sub_theme_id,
      target_group_id,
      activity_type_id,
      sdg_id,
      beneficiary_group,
      min_amount,
      max_amount,
      is_archived,
      include_archived
    } = req.query;

    const values = [];
    let paramCount = 1;
    let query = `
      SELECT DISTINCT
        p.project_id,
        p.doc_no,
        p.project_name,
        p.year,
        p.approval_date,
        p.sanctioned_amount,
        p.classification_status,
        p.classification_method,
        p.is_archived,
        a.agency_name,
        s.state_name,
        ps.status_name as implementation_status
      FROM projects p
      LEFT JOIN agencies a ON p.agency_id = a.agency_id
      LEFT JOIN states s ON p.state_id = s.state_id
      LEFT JOIN project_status ps ON p.status_id = ps.status_id
      WHERE 1 = 1
    `;

    // 1. Archiving status filter
    if (String(is_archived) === 'true') {
      query += ` AND p.is_archived = true`;
    } else if (String(include_archived) === 'true') {
      // Return both active and archived
    } else {
      query += ` AND p.is_archived = false`;
    }

    // 2. Project fields filters
    if (doc_no) {
      query += ` AND p.doc_no ILIKE $${paramCount}`;
      values.push(`%${doc_no}%`);
      paramCount++;
    }

    if (year) {
      query += ` AND p.year = $${paramCount}`;
      values.push(year);
      paramCount++;
    }

    if (status) {
      query += ` AND p.classification_status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (agency_id) {
      query += ` AND p.agency_id = $${paramCount}`;
      values.push(Number(agency_id));
      paramCount++;
    }

    if (funding_source_id) {
      query += ` AND p.funding_source_id = $${paramCount}`;
      values.push(Number(funding_source_id));
      paramCount++;
    }

    if (state_id) {
      query += ` AND p.state_id = $${paramCount}`;
      values.push(Number(state_id));
      paramCount++;
    }

    if (status_id) {
      query += ` AND p.status_id = $${paramCount}`;
      values.push(Number(status_id));
      paramCount++;
    }

    if (search) {
      query += ` AND p.project_name ILIKE $${paramCount}`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // 3. Date range filters
    if (approval_date_start) {
      query += ` AND p.approval_date >= $${paramCount}`;
      values.push(approval_date_start);
      paramCount++;
    }
    if (approval_date_end) {
      query += ` AND p.approval_date <= $${paramCount}`;
      values.push(approval_date_end);
      paramCount++;
    }

    // 4. Financial filters
    if (min_amount) {
      query += ` AND p.sanctioned_amount >= $${paramCount}`;
      values.push(Number(min_amount));
      paramCount++;
    }
    if (max_amount) {
      query += ` AND p.sanctioned_amount <= $${paramCount}`;
      values.push(Number(max_amount));
      paramCount++;
    }

    // 5. Theme filter (Primary)
    if (theme_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_themes pt 
        WHERE pt.project_id = p.project_id AND pt.primary_flag = true AND pt.theme_id = $${paramCount}
      )`;
      values.push(Number(theme_id));
      paramCount++;
    }

    // 6. Sub Theme filter
    if (sub_theme_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_sub_themes pst 
        WHERE pst.project_id = p.project_id AND pst.sub_theme_id = $${paramCount}
      )`;
      values.push(Number(sub_theme_id));
      paramCount++;
    }

    // 7. Target Group filter
    if (target_group_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_target_groups ptg 
        WHERE ptg.project_id = p.project_id AND ptg.target_group_id = $${paramCount}
      )`;
      values.push(Number(target_group_id));
      paramCount++;
    }

    // 8. Activity Type filter
    if (activity_type_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_activity_types pat 
        WHERE pat.project_id = p.project_id AND pat.activity_type_id = $${paramCount}
      )`;
      values.push(Number(activity_type_id));
      paramCount++;
    }

    // 9. SDG filter
    if (sdg_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_sdgs psd 
        WHERE psd.project_id = p.project_id AND psd.sdg_id = $${paramCount}
      )`;
      values.push(Number(sdg_id));
      paramCount++;
    }

    // 10. Geography Block/District filter
    if (block_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_locations pl 
        JOIN locations loc ON pl.location_id = loc.location_id 
        WHERE pl.project_id = p.project_id AND loc.block_id = $${paramCount}
      )`;
      values.push(Number(block_id));
      paramCount++;
    } else if (district_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_locations pl 
        JOIN locations loc ON pl.location_id = loc.location_id 
        JOIN blocks b ON loc.block_id = b.block_id
        WHERE pl.project_id = p.project_id AND b.district_id = $${paramCount}
      )`;
      values.push(Number(district_id));
      paramCount++;
    }

    // 11. Beneficiary filters
    if (beneficiary_group) {
      let beneficiaryCondition = "";
      if (beneficiary_group === "Women") {
        beneficiaryCondition = "tg.main_group = 'Women'";
      } else if (beneficiary_group === "Girls") {
        beneficiaryCondition = "tg.main_group = 'Girls'";
      } else if (beneficiary_group === "Boys") {
        beneficiaryCondition = "tg.main_group = 'Boys'";
      } else if (beneficiary_group === "Men") {
        beneficiaryCondition = "tg.main_group = 'Men'";
      } else if (beneficiary_group === "Youth") {
        beneficiaryCondition = "tg.main_group = 'Youth'";
      } else if (beneficiary_group === "Farmers") {
        beneficiaryCondition = "tg.main_group = 'Farmers' OR tg.sub_group = 'Farmers' OR tg.sub_group = 'Women Farmers' OR tg.sub_group = 'Small Farmers'";
      } else if (beneficiary_group === "SHGs") {
        beneficiaryCondition = "tg.sub_group = 'SHG Members' OR tg.sub_group = 'SHGs'";
      } else if (beneficiary_group === "Teachers") {
        beneficiaryCondition = "tg.sub_group = 'Teachers'";
      } else if (beneficiary_group === "Persons with Disabilities") {
        beneficiaryCondition = "tg.main_group = 'Persons with Disabilities' OR tg.sub_group = 'Children with Disabilities'";
      } else if (beneficiary_group === "Elderly") {
        beneficiaryCondition = "tg.main_group = 'Elderly' OR tg.sub_group = 'Senior Citizens'";
      }

      if (beneficiaryCondition) {
        query += ` AND EXISTS (
          SELECT 1 FROM project_target_groups ptg 
          JOIN target_groups tg ON ptg.target_group_id = tg.target_group_id
          WHERE ptg.project_id = p.project_id AND (${beneficiaryCondition})
        )`;
      }
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

/*
=========================================
DUPLICATE PROJECT
=========================================
*/
router.post("/:id/duplicate", async (req, res) => {
  const { id } = req.params;
  try {
    const origRes = await pool.query("SELECT * FROM projects WHERE project_id = $1", [id]);
    if (origRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    const orig = origRes.rows[0];
    
    // Create cloned project record
    const cloneName = `Copy of ${orig.project_name}`;
    const insertRes = await pool.query(
      `INSERT INTO projects (
        doc_no, project_name, agency_id, year, approval_date, sanctioned_amount,
        duration_months, status_id, funding_source_id, created_by, remarks,
        classification_status, state_id, is_archived, classification_method
      )
      VALUES (
        NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending', $11, false, 'Manual'
      )
      RETURNING *`,
      [
        cloneName, orig.agency_id, orig.year, orig.approval_date, orig.sanctioned_amount,
        orig.duration_months, orig.status_id, orig.funding_source_id, orig.created_by, orig.remarks,
        orig.state_id
      ]
    );
    
    const newProjectId = insertRes.rows[0].project_id;
    
    // 1. Primary theme
    const themes = await pool.query("SELECT * FROM project_themes WHERE project_id = $1", [id]);
    for (const t of themes.rows) {
      await pool.query(
        "INSERT INTO project_themes (project_id, theme_id, primary_flag, remarks) VALUES ($1, $2, $3, $4)",
        [newProjectId, t.theme_id, t.primary_flag, t.remarks]
      );
    }
    
    // 2. Sub-themes
    const subThemes = await pool.query("SELECT * FROM project_sub_themes WHERE project_id = $1", [id]);
    for (const st of subThemes.rows) {
      await pool.query(
        "INSERT INTO project_sub_themes (project_id, sub_theme_id) VALUES ($1, $2)",
        [newProjectId, st.sub_theme_id]
      );
    }
    
    // 3. Target groups
    const targetGroups = await pool.query("SELECT * FROM project_target_groups WHERE project_id = $1", [id]);
    for (const tg of targetGroups.rows) {
      await pool.query(
        "INSERT INTO project_target_groups (project_id, target_group_id, primary_group, remarks) VALUES ($1, $2, $3, $4)",
        [newProjectId, tg.target_group_id, tg.primary_group, tg.remarks]
      );
    }
    
    // 4. Activity types
    const activityTypes = await pool.query("SELECT * FROM project_activity_types WHERE project_id = $1", [id]);
    for (const at of activityTypes.rows) {
      await pool.query(
        "INSERT INTO project_activity_types (project_id, activity_type_id) VALUES ($1, $2)",
        [newProjectId, at.activity_type_id]
      );
    }

    res.status(201).json({
      success: true,
      message: "Project duplicated successfully",
      data: insertRes.rows[0]
    });
  } catch (error) {
    console.error("Duplicate Project Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/*
=========================================
ARCHIVE PROJECT
=========================================
*/
router.post("/:id/archive", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE projects SET is_archived = true, updated_at = NOW() WHERE project_id = $1 RETURNING project_id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    res.json({ success: true, message: "Project archived successfully", projectId: id });
  } catch (error) {
    console.error("Archive Project Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/*
=========================================
UNARCHIVE PROJECT
=========================================
*/
router.post("/:id/unarchive", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE projects SET is_archived = false, updated_at = NOW() WHERE project_id = $1 RETURNING project_id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    res.json({ success: true, message: "Project unarchived successfully", projectId: id });
  } catch (error) {
    console.error("Unarchive Project Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Helper to parse year input (e.g. 2022-25, comma-separated, single)
function parseYearInput(input) {
  if (!input) return [];
  const cleanInput = String(input).trim();
  
  // Pattern 1: Range like 2022-25 or 2022-2025 or 2022/25
  const rangeMatch = cleanInput.match(/^(\d{4})[-/](\d{2,4})$/);
  if (rangeMatch) {
    const startStr = rangeMatch[1];
    let endStr = rangeMatch[2];
    
    const startYear = parseInt(startStr, 10);
    if (endStr.length === 2) {
      const century = startStr.substring(0, 2);
      endStr = century + endStr;
    }
    const endYear = parseInt(endStr, 10);
    
    if (startYear < endYear) {
      const years = [];
      for (let y = startYear; y < endYear; y++) {
        const nextY = (y + 1) % 100;
        const nextYStr = nextY < 10 ? `0${nextY}` : `${nextY}`;
        years.push(`${y}-${nextYStr}`);
      }
      return years;
    }
  }

  // Pattern 2: Comma separated values
  if (cleanInput.includes(",")) {
    return cleanInput.split(",").map(s => s.trim()).filter(Boolean);
  }

  return [cleanInput];
}

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

// Helper function to resolve or create theme
async function getOrCreateTheme(theme) {
  if (!theme) return null;
  if (!isNaN(theme) && Number.isInteger(Number(theme))) {
    return Number(theme);
  }
  const name = String(theme).trim();
  const res = await pool.query("SELECT theme_id FROM themes WHERE theme_name = $1", [name]);
  if (res.rows.length > 0) {
    return res.rows[0].theme_id;
  }
  const insertRes = await pool.query(
    "INSERT INTO themes (theme_name, is_active) VALUES ($1, true) RETURNING theme_id",
    [name]
  );
  return insertRes.rows[0].theme_id;
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
      include_archived,
      beneficiary_main_group,
      beneficiary_sub_groups,
      target_group_filters,
      funding_source,
      funding_source2
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
        p.funding_type,
        p.donor_agency_name,
        p.donor_category,
        p.district,
        p.block_village_ulb,
        p.total_beneficiaries,
        p.direct_beneficiaries,
        p.indirect_beneficiaries,
        p.beneficiaries_male,
        p.beneficiaries_female,
        p.beneficiaries_boys,
        p.beneficiaries_girls,
        p.outcome_impact_notes,
        p.images,
        p.duration_months,
        p.area_type,
        p.rural_subtype,
        p.urban_subtype,
        p.settlement_detail,
        p.geography_notes,
        p.beneficiary_counts,
        p.beneficiary_groups,
        p.beneficiary_cat1,
        p.age_groups,
        p.remarks,
        a.agency_name,
        COALESCE(
          (SELECT STRING_AGG(st.state_name, ', ') FROM project_states p_s JOIN states st ON p_s.state_id = st.state_id WHERE p_s.project_id = p.project_id),
          s.state_name
        ) as state_name,
        ps.status_name as implementation_status,
        fs1.source_name as funding_source,
        fs2.source_name as funding_source2,
        (
          SELECT STRING_AGG(t.theme_name, ', ') FROM project_themes pt JOIN themes t ON pt.theme_id = t.theme_id WHERE pt.project_id = p.project_id
        ) as theme1,
        (
          SELECT STRING_AGG(st.sub_theme_name, ', ') FROM project_sub_themes pst JOIN sub_themes st ON pst.sub_theme_id = st.sub_theme_id WHERE pst.project_id = p.project_id
        ) as sub_themes,
        (
          SELECT STRING_AGG(at.activity_type_name, ', ') FROM project_activity_types pat JOIN activity_types at ON pat.activity_type_id = at.activity_type_id WHERE pat.project_id = p.project_id
        ) as activity_types,
        (
          SELECT STRING_AGG(tg.main_group || ' - ' || tg.sub_group, ', ') FROM project_target_groups ptg JOIN target_groups tg ON ptg.target_group_id = tg.target_group_id WHERE ptg.project_id = p.project_id
        ) as target_groups,
        t2.theme_name as theme2
      FROM projects p
      LEFT JOIN agencies a ON p.agency_id = a.agency_id
      LEFT JOIN states s ON p.state_id = s.state_id
      LEFT JOIN project_status ps ON p.status_id = ps.status_id
      LEFT JOIN funding_sources fs1 ON p.funding_source_id = fs1.funding_source_id
      LEFT JOIN funding_sources fs2 ON p.funding_source2_id = fs2.funding_source_id
      LEFT JOIN themes t2 ON p.theme2_id = t2.theme_id
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
      const yearList = parseYearInput(year);
      if (yearList.length > 0) {
        const placeholders = yearList.map((_, i) => `$${paramCount + i}`).join(",");
        query += ` AND p.year IN (${placeholders})`;
        values.push(...yearList);
        paramCount += yearList.length;
      }
    }

    if (status) {
      query += ` AND p.classification_status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (agency_id) {
      const ids = String(agency_id).split(',').map(Number).filter(Boolean);
      if (ids.length > 0) {
        query += ` AND p.agency_id = ANY($${paramCount})`;
        values.push(ids);
        paramCount++;
      }
    }

    if (funding_source_id) {
      query += ` AND p.funding_source_id = $${paramCount}`;
      values.push(Number(funding_source_id));
      paramCount++;
    }

    if (funding_source) {
      query += ` AND fs1.source_name = $${paramCount}`;
      values.push(String(funding_source));
      paramCount++;
    }

    if (funding_source2) {
      query += ` AND fs2.source_name = $${paramCount}`;
      values.push(String(funding_source2));
      paramCount++;
    }

    if (state_id) {
      query += ` AND (p.state_id = $${paramCount} OR EXISTS (
        SELECT 1 FROM project_states ps
        WHERE ps.project_id = p.project_id AND ps.state_id = $${paramCount}
      ))`;
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

    // 5. Theme filter (Any matching theme selection)
    if (theme_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_themes pt 
        WHERE pt.project_id = p.project_id AND pt.theme_id = $${paramCount}
      )`;
      values.push(Number(theme_id));
      paramCount++;
    }

    if (req.query.taxonomy_category) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_themes pt 
        WHERE pt.project_id = p.project_id AND pt.taxonomy_category = $${paramCount}
      )`;
      values.push(String(req.query.taxonomy_category));
      paramCount++;
    }

    if (req.query.taxonomy_sub_category) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_themes pt 
        WHERE pt.project_id = p.project_id AND pt.taxonomy_sub_category = $${paramCount}
      )`;
      values.push(String(req.query.taxonomy_sub_category));
      paramCount++;
    }

    if (req.query.taxonomy_activity) {
      query += ` AND EXISTS (
        SELECT 1 FROM project_themes pt 
        WHERE pt.project_id = p.project_id AND pt.taxonomy_activity = $${paramCount}
      )`;
      values.push(String(req.query.taxonomy_activity));
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
      } else if (beneficiary_group === "All gender") {
        beneficiaryCondition = "tg.main_group = 'All'";
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

    if (target_group_filters) {
      try {
        const filters = typeof target_group_filters === 'string'
          ? JSON.parse(target_group_filters)
          : target_group_filters;
        if (Array.isArray(filters) && filters.length > 0) {
          const filterConditions = [];
          for (const f of filters) {
            if (f.mainGroup) {
              const currentConditions = [];

              // 1. Check projects columns directly
              let colCondition = `p.beneficiary_groups ILIKE $${paramCount}`;
              values.push(`%${f.mainGroup}%`);
              paramCount++;

              if (f.subGroups && f.subGroups.length > 0) {
                const subConds = [];
                f.subGroups.forEach(sg => {
                  subConds.push(`p.beneficiary_cat1 ILIKE $${paramCount}`);
                  values.push(`%${sg}%`);
                  paramCount++;
                });
                colCondition += ` AND (${subConds.join(" OR ")})`;
              }
              currentConditions.push(`(${colCondition})`);

              // 2. Check target_groups taxonomy table
              let tgMainGroup = f.mainGroup;
              if (tgMainGroup === "All gender") {
                tgMainGroup = "All";
              }
              const dbMainGroups = ["All", "Children", "Men", "Women", "Youth"];
              if (dbMainGroups.includes(tgMainGroup)) {
                let taxCondition = `tg.main_group = $${paramCount}`;
                values.push(tgMainGroup);
                paramCount++;

                if (f.subGroups && f.subGroups.length > 0) {
                  taxCondition += ` AND tg.sub_group = ANY($${paramCount})`;
                  values.push(f.subGroups);
                  paramCount++;
                }

                currentConditions.push(`EXISTS (
                  SELECT 1 FROM project_target_groups ptg
                  JOIN target_groups tg ON ptg.target_group_id = tg.target_group_id
                  WHERE ptg.project_id = p.project_id AND (${taxCondition})
                )`);
              }

              filterConditions.push(`(${currentConditions.join(" OR ")})`);
            }
          }

          if (filterConditions.length > 0) {
            query += ` AND (${filterConditions.join(" AND ")})`;
          }
        }
      } catch (err) {
        console.error("Error parsing target_group_filters:", err);
      }
    } else {
      if (beneficiary_main_group) {
        query += ` AND EXISTS (
          SELECT 1 FROM project_target_groups ptg 
          JOIN target_groups tg ON ptg.target_group_id = tg.target_group_id
          WHERE ptg.project_id = p.project_id AND tg.main_group = $${paramCount}
        )`;
        values.push(beneficiary_main_group);
        paramCount++;
      }

      if (beneficiary_sub_groups) {
        const subs = String(beneficiary_sub_groups).split(',').filter(Boolean);
        if (subs.length > 0) {
          query += ` AND EXISTS (
            SELECT 1 FROM project_target_groups ptg 
            JOIN target_groups tg ON ptg.target_group_id = tg.target_group_id
            WHERE ptg.project_id = p.project_id AND tg.sub_group = ANY($${paramCount})
          )`;
          values.push(subs);
          paramCount++;
        }
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
    funding_source2,
    approval_date,
    sanctioned_amount,
    status_id,
    state,
    theme1,
    theme2,
    remarks,
    funding_type,
    donor_agency_name,
    donor_category,
    duration_months,
    district,
    block_village_ulb,
    doc_no
  } = req.body;

  if (!project_name) {
    return res.status(400).json({ success: false, message: "Project name is required" });
  }

  try {
    const agencyId = await getOrCreateAgency(agency);
    const fundingSourceId = await getOrCreateFunding(funding_source);
    const fundingSource2Id = await getOrCreateFunding(funding_source2);

    // Resolve multiple states
    const statesArray = Array.isArray(state) ? state : (state ? [state] : []);
    const stateIds = [];
    for (const st of statesArray) {
      const stId = await getOrCreateState(st);
      if (stId) stateIds.push(stId);
    }
    const primaryStateId = stateIds.length > 0 ? stateIds[0] : null;

    const theme1Id = await getOrCreateTheme(theme1);
    const theme2Id = await getOrCreateTheme(theme2);

    const result = await pool.query(
      `INSERT INTO projects (
        project_name, agency_id, year, funding_source_id, funding_source2_id, 
        theme1_id, theme2_id, approval_date, sanctioned_amount, status_id, 
        state_id, remarks, classification_status,
        funding_type, donor_agency_name, donor_category, duration_months,
        district, block_village_ulb, doc_no
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Pending', $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        project_name,
        agencyId,
        year || null,
        fundingSourceId,
        fundingSource2Id,
        theme1Id,
        theme2Id,
        approval_date ? approval_date : null,
        sanctioned_amount ? Number(sanctioned_amount) : null,
        status_id ? Number(status_id) : null,
        primaryStateId,
        remarks || null,
        funding_type || null,
        donor_agency_name || null,
        donor_category || null,
        duration_months ? Number(duration_months) : null,
        district || null,
        block_village_ulb || null,
        doc_no || null
      ]
    );

    const newProjectId = result.rows[0].project_id;
    for (const stId of stateIds) {
      await pool.query(
        "INSERT INTO project_states (project_id, state_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [newProjectId, stId]
      );
    }

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
    funding_source2,
    approval_date,
    sanctioned_amount,
    status_id,
    state,
    theme1,
    theme2,
    remarks,
    funding_type,
    donor_agency_name,
    donor_category,
    duration_months,
    staff_count,
    district,
    block_village_ulb,
    doc_no,
    fcra_nature
  } = req.body;

  if (!project_name) {
    return res.status(400).json({ success: false, message: "Project name is required" });
  }

  try {
    const agencyId = await getOrCreateAgency(agency);
    const fundingSourceId = await getOrCreateFunding(funding_source);
    const fundingSource2Id = await getOrCreateFunding(funding_source2);

    // Resolve multiple states
    const statesArray = Array.isArray(state) ? state : (state ? [state] : []);
    const stateIds = [];
    for (const st of statesArray) {
      const stId = await getOrCreateState(st);
      if (stId) stateIds.push(stId);
    }
    const primaryStateId = stateIds.length > 0 ? stateIds[0] : null;

    const theme1Id = await getOrCreateTheme(theme1);
    const theme2Id = await getOrCreateTheme(theme2);

     const result = await pool.query(
      `UPDATE projects 
       SET project_name = $1, agency_id = $2, year = $3, funding_source_id = $4,
           funding_source2_id = $5, theme1_id = $6, theme2_id = $7, approval_date = $8, 
           sanctioned_amount = $9, status_id = $10, state_id = $11, remarks = $12, 
           funding_type = $13, donor_agency_name = $14, donor_category = $15,
           duration_months = $16, district = $17, block_village_ulb = $18, doc_no = $19,
           staff_count = $20, fcra_nature = $21,
           updated_at = NOW()
       WHERE project_id = $22
       RETURNING *`,
      [
        project_name,
        agencyId,
        year || null,
        fundingSourceId,
        fundingSource2Id,
        theme1Id,
        theme2Id,
        approval_date ? approval_date : null,
        sanctioned_amount ? Number(sanctioned_amount) : null,
        status_id ? Number(status_id) : null,
        primaryStateId,
        remarks || null,
        funding_type || null,
        donor_agency_name || null,
        donor_category || null,
        duration_months ? Number(duration_months) : null,
        district || null,
        block_village_ulb || null,
        doc_no || null,
        staff_count ? Number(staff_count) : null,
        fcra_nature || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Update project_states table
    await pool.query("DELETE FROM project_states WHERE project_id = $1", [id]);
    for (const stId of stateIds) {
      await pool.query(
        "INSERT INTO project_states (project_id, state_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [id, stId]
      );
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

/*
=========================================
UNCLASSIFY PROJECT
=========================================
*/
router.post("/:id/unclassify", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Update project classification fields to Pending/null
    const result = await client.query(
      `UPDATE projects 
       SET classification_status = 'Pending', 
           classification_method = null,
           theme1_id = null,
           theme2_id = null,
           age_groups = null,
           beneficiary_groups = null,
           beneficiary_cat1 = null,
           beneficiary_cat2 = null,
           beneficiary_cat3 = null,
           beneficiary_cat4 = null,
           area_type = null,
           rural_subtype = null,
           urban_subtype = null,
           settlement_detail = null,
           geography_notes = null,
           beneficiary_counts = null,
           total_beneficiaries = null,
           direct_beneficiaries = null,
           indirect_beneficiaries = null,
           beneficiaries_male = null,
           beneficiaries_female = null,
           beneficiaries_boys = null,
           beneficiaries_girls = null,
           outcome_impact_notes = null,
           images = null,
           documents = null,
           duration_months = null,
           staff_count = null,
           start_date = null,
           end_date = null,
           updated_at = NOW() 
       WHERE project_id = $1 
       RETURNING project_id`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Delete mapping records
    await client.query("DELETE FROM project_themes WHERE project_id = $1", [id]);
    await client.query("DELETE FROM project_sub_themes WHERE project_id = $1", [id]);
    await client.query("DELETE FROM project_target_groups WHERE project_id = $1", [id]);
    await client.query("DELETE FROM project_activity_types WHERE project_id = $1", [id]);
    await client.query("DELETE FROM project_sdgs WHERE project_id = $1", [id]);

    await client.query("COMMIT");
    res.json({ success: true, message: "Project moved to unclassified successfully", projectId: id });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Unclassify Project Error:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
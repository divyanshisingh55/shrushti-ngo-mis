const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const XLSX = require("xlsx");

// Helper function to build the base query and parameters
function buildQuery(req) {
  const {
    year,
    theme_id,
    agency_id,
    status,
    sub_theme_id,
    target_group_id,
    state_id,
    district_id,
    is_archived
  } = req.query;

  let query = `
    SELECT DISTINCT
      p.project_id,
      p.doc_no,
      p.project_name,
      a.agency_name,
      p.year,
      p.approval_date,
      p.sanctioned_amount,
      fs.source_name as funding_source,
      ps.status_name as project_status,
      COALESCE(
        (SELECT STRING_AGG(st.state_name, ', ') FROM project_states p_s JOIN states st ON p_s.state_id = st.state_id WHERE p_s.project_id = p.project_id),
        s.state_name
      ) as state,
      (
        SELECT STRING_AGG(th.theme_name, ', ')
        FROM project_themes pt_t
        JOIN themes th ON pt_t.theme_id = th.theme_id
        WHERE pt_t.project_id = p.project_id
      ) as primary_theme,
      (
        SELECT STRING_AGG(st.sub_theme_name, ', ') 
        FROM project_sub_themes pst 
        JOIN sub_themes st ON pst.sub_theme_id = st.sub_theme_id 
        WHERE pst.project_id = p.project_id
      ) as sub_themes,
      (
        SELECT STRING_AGG(tg.main_group || ' - ' || tg.sub_group, ', ') 
        FROM project_target_groups ptg 
        JOIN target_groups tg ON ptg.target_group_id = tg.target_group_id 
        WHERE ptg.project_id = p.project_id
      ) as target_groups,
      (
        SELECT STRING_AGG(at.activity_type_name, ', ') 
        FROM project_activity_types pat 
        JOIN activity_types at ON pat.activity_type_id = at.activity_type_id 
        WHERE pat.project_id = p.project_id
      ) as activity_types,
      p.classification_status,
      p.remarks
    FROM projects p
    LEFT JOIN agencies a ON p.agency_id = a.agency_id
    LEFT JOIN funding_sources fs ON p.funding_source_id = fs.funding_source_id
    LEFT JOIN project_status ps ON p.status_id = ps.status_id
    LEFT JOIN states s ON p.state_id = s.state_id
    WHERE 1 = 1
  `;

  const values = [];
  let paramCount = 1;

  if (String(is_archived) === 'true') {
    query += ` AND p.is_archived = true`;
  } else {
    query += ` AND p.is_archived = false`;
  }

  if (year) {
    query += ` AND p.year = $${paramCount}`;
    values.push(year);
    paramCount++;
  }
  if (theme_id) {
    query += ` AND EXISTS (
      SELECT 1 FROM project_themes pt_filter
      WHERE pt_filter.project_id = p.project_id AND pt_filter.theme_id = $${paramCount}
    )`;
    values.push(Number(theme_id));
    paramCount++;
  }
  if (agency_id) {
    query += ` AND p.agency_id = $${paramCount}`;
    values.push(Number(agency_id));
    paramCount++;
  }
  if (status) {
    query += ` AND p.classification_status = $${paramCount}`;
    values.push(status);
    paramCount++;
  }
  if (state_id) {
    query += ` AND (p.state_id = $${paramCount} OR EXISTS (
      SELECT 1 FROM project_states p_st 
      WHERE p_st.project_id = p.project_id AND p_st.state_id = $${paramCount}
    ))`;
    values.push(Number(state_id));
    paramCount++;
  }
  if (sub_theme_id) {
    query += ` AND EXISTS (
      SELECT 1 FROM project_sub_themes pst 
      WHERE pst.project_id = p.project_id AND pst.sub_theme_id = $${paramCount}
    )`;
    values.push(Number(sub_theme_id));
    paramCount++;
  }
  if (target_group_id) {
    query += ` AND EXISTS (
      SELECT 1 FROM project_target_groups ptg 
      WHERE ptg.project_id = p.project_id AND ptg.target_group_id = $${paramCount}
    )`;
    values.push(Number(target_group_id));
    paramCount++;
  }
  if (district_id) {
    query += ` AND EXISTS (
      SELECT 1 FROM project_locations pl 
      JOIN locations loc ON pl.location_id = loc.location_id 
      JOIN blocks b ON loc.block_id = b.block_id
      WHERE pl.project_id = p.project_id AND b.district_id = $${paramCount}
    )`;
    values.push(Number(district_id));
    paramCount++;
  }

  query += ` ORDER BY p.project_id DESC`;

  return { query, values };
}

// 1. GET ALL PROJECTS WITH CLASSIFICATION FOR REPORTS
router.get("/", async (req, res) => {
  try {
    const { query, values } = buildQuery(req);
    const result = await pool.query(query, values);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error("Reports Fetch Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper to map and format rows for export
function mapExportData(rows) {
  return rows.map(r => ({
    "Project ID": r.project_id,
    "Doc No": r.doc_no || "",
    "Project Name": r.project_name,
    "Agency": r.agency_name || "",
    "Year": r.year || "",
    "Approval Date": r.approval_date ? new Date(r.approval_date).toISOString().split('T')[0] : "",
    "Sanctioned Amount (Rs.)": r.sanctioned_amount ? Number(r.sanctioned_amount) : 0,
    "Funding Source": r.funding_source || "",
    "Project Status": r.project_status || "",
    "State": r.state || "",
    "Primary Theme": r.primary_theme || "",
    "Sub-Themes": r.sub_themes || "",
    "Target Groups": r.target_groups || "",
    "Activity Types": r.activity_types || "",
    "Classification Status": r.classification_status,
    "Remarks": r.remarks || ""
  }));
}

// 2. EXPORT TO CSV
router.get("/export/csv", async (req, res) => {
  try {
    const { query, values } = buildQuery(req);
    const result = await pool.query(query, values);
    const data = mapExportData(result.rows);

    if (data.length === 0) {
      // Return empty CSV with headers
      const headers = [
        "Project ID", "Doc No", "Project Name", "Agency", "Year", "Approval Date",
        "Sanctioned Amount (Rs.)", "Funding Source", "Project Status", "State",
        "Primary Theme", "Sub-Themes", "Target Groups", "Activity Types",
        "Classification Status", "Remarks"
      ];
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=projects_report.csv");
      return res.send(headers.join(",") + "\n");
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvContent = csvRows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=projects_report.csv");
    res.send(csvContent);
  } catch (error) {
    console.error("CSV Export Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. EXPORT TO EXCEL
router.get("/export/excel", async (req, res) => {
  try {
    const { query, values } = buildQuery(req);
    const result = await pool.query(query, values);
    const data = mapExportData(result.rows);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "NGO Projects Report");
    
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=projects_report.xlsx");
    res.send(buf);
  } catch (error) {
    console.error("Excel Export Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

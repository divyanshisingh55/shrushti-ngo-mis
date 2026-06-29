const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");

// Helper function to build the base query and parameters
function buildQuery(req) {
  const {
    year,
    theme_id,
    agency_id,
    status, // classification_status
    sub_theme_id,
    target_group_id,
    state_id,
    district_id,
    block_id,
    status_id, // implementation status_id
    search,
    doc_no,
    funding_source_id,
    activity_type_id,
    sdg_id,
    beneficiary_group,
    min_amount,
    max_amount,
    approval_date_start,
    approval_date_end,
    is_archived,
    project_ids,
    beneficiary_main_group,
    beneficiary_sub_groups,
    target_group_filters
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
      p.duration_months,
      p.funding_type,
      p.donor_agency_name,
      p.donor_category,
      p.district,
      p.block_village_ulb,
      p.area_type,
      p.rural_subtype,
      p.urban_subtype,
      p.settlement_detail,
      p.geography_notes,
      p.total_beneficiaries,
      p.direct_beneficiaries,
      p.indirect_beneficiaries,
      p.beneficiaries_male,
      p.beneficiaries_female,
      p.beneficiaries_boys,
      p.beneficiaries_girls,
      p.outcome_impact_notes,
      p.beneficiary_counts,
      p.age_groups,
      p.remarks,
      p.staff_count,
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
      p.classification_status
    FROM projects p
    LEFT JOIN agencies a ON p.agency_id = a.agency_id
    LEFT JOIN funding_sources fs ON p.funding_source_id = fs.funding_source_id
    LEFT JOIN project_status ps ON p.status_id = ps.status_id
    LEFT JOIN states s ON p.state_id = s.state_id
    WHERE 1 = 1
  `;

  const values = [];
  let paramCount = 1;

  if (project_ids) {
    // Skip is_archived filter if specific project IDs are provided
  } else if (String(is_archived) === 'true') {
    query += ` AND p.is_archived = true`;
  } else {
    query += ` AND p.is_archived = false`;
  }

  if (project_ids) {
    const ids = String(project_ids).split(',').map(Number).filter(Boolean);
    if (ids.length > 0) {
      query += ` AND p.project_id = ANY($${paramCount})`;
      values.push(ids);
      paramCount++;
    }
  }

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

  if (state_id) {
    query += ` AND (p.state_id = $${paramCount} OR EXISTS (
      SELECT 1 FROM project_states p_st 
      WHERE p_st.project_id = p.project_id AND p_st.state_id = $${paramCount}
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

  if (theme_id) {
    query += ` AND EXISTS (
      SELECT 1 FROM project_themes pt_filter
      WHERE pt_filter.project_id = p.project_id AND pt_filter.theme_id = $${paramCount}
    )`;
    values.push(Number(theme_id));
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

  if (activity_type_id) {
    query += ` AND EXISTS (
      SELECT 1 FROM project_activity_types pat 
      WHERE pat.project_id = p.project_id AND pat.activity_type_id = $${paramCount}
    )`;
    values.push(Number(activity_type_id));
    paramCount++;
  }

  if (sdg_id) {
    query += ` AND EXISTS (
      SELECT 1 FROM project_sdgs psd 
      WHERE psd.project_id = p.project_id AND psd.sdg_id = $${paramCount}
    )`;
    values.push(Number(sdg_id));
    paramCount++;
  }

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

  if (target_group_filters) {
    try {
      const filters = typeof target_group_filters === 'string'
        ? JSON.parse(target_group_filters)
        : target_group_filters;
      if (Array.isArray(filters) && filters.length > 0) {
        const filterConditions = [];
        for (const f of filters) {
          if (f.mainGroup) {
            let condition = `tg.main_group = $${paramCount}`;
            values.push(f.mainGroup);
            paramCount++;

            if (f.subGroups && f.subGroups.length > 0) {
              condition += ` AND tg.sub_group = ANY($${paramCount})`;
              values.push(f.subGroups);
              paramCount++;
            }
            filterConditions.push(`(${condition})`);
          }
        }

        if (filterConditions.length > 0) {
          query += ` AND EXISTS (
            SELECT 1 FROM project_target_groups ptg
            JOIN target_groups tg ON ptg.target_group_id = tg.target_group_id
            WHERE ptg.project_id = p.project_id AND (${filterConditions.join(" OR ")})
          )`;
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
  return rows.map(r => {
    let parsedCounts = [];
    try {
      if (r.beneficiary_counts) {
        parsedCounts = JSON.parse(r.beneficiary_counts);
      }
    } catch (e) {
      console.error("Error parsing beneficiary_counts in report export:", e);
    }

    const genders = Array.from(new Set(parsedCounts.map(c => c.gender))).filter(Boolean).join(", ");
    const educations = Array.from(new Set(parsedCounts.map(c => c.educationStage))).filter(Boolean).join(", ");
    const vulnerabilities = Array.from(new Set(parsedCounts.flatMap(c => c.vulnerabilities || []))).filter(Boolean).join(", ");

    return {
      "Year": r.year || "",
      "Doc. No.": r.doc_no || "",
      "Name of Agency": r.agency_name || "",
      "Name of Project": r.project_name,
      "Date of Approval": r.approval_date ? new Date(r.approval_date).toISOString().split('T')[0] : "",
      "Sanctioned Amount": r.sanctioned_amount ? Number(r.sanctioned_amount) : 0,
      "Status": r.project_status || "",
      "Source of Funding": r.funding_source || "",
      "Funding Type": r.funding_type || "",
      "Donor Agency Name": r.donor_agency_name || "",
      "Donor Category": r.donor_category || "",
      "State": r.state || "",
      "District": r.district || "",
      "Block/Village/ULB": r.block_village_ulb || "",
      "Area Type": r.area_type || "",
      "Rural Subtype": r.rural_subtype || "",
      "Urban Subtype": r.urban_subtype || "",
      "Settlement Detail": r.settlement_detail || "",
      "Geography Notes": r.geography_notes || "",
      "Major Theme": r.primary_theme || "",
      "Sub Theme": r.sub_themes || "",
      "Activity Type": r.activity_types || "",
      "Target Group": r.target_groups || "",
      "Age Group": r.age_groups || "",
      "Gender": genders,
      "Education Stage": educations,
      "Social Group": vulnerabilities,
      "Disability/other vulnerability": vulnerabilities,
      "No. of beneficiaries": r.total_beneficiaries !== null && r.total_beneficiaries !== undefined ? Number(r.total_beneficiaries) : 0,
      "Direct beneficiaries": r.direct_beneficiaries !== null && r.direct_beneficiaries !== undefined ? Number(r.direct_beneficiaries) : 0,
      "Indirect beneficiaries": r.indirect_beneficiaries !== null && r.indirect_beneficiaries !== undefined ? Number(r.indirect_beneficiaries) : 0,
      "Male": r.beneficiaries_male !== null && r.beneficiaries_male !== undefined ? Number(r.beneficiaries_male) : 0,
      "Female": r.beneficiaries_female !== null && r.beneficiaries_female !== undefined ? Number(r.beneficiaries_female) : 0,
      "Boys": r.beneficiaries_boys !== null && r.beneficiaries_boys !== undefined ? Number(r.beneficiaries_boys) : 0,
      "Girls": r.beneficiaries_girls !== null && r.beneficiaries_girls !== undefined ? Number(r.beneficiaries_girls) : 0,
      "Completed/Ongoing": r.project_status || "",
      "Duration (Months)": r.duration_months !== null && r.duration_months !== undefined ? Number(r.duration_months) : 0,
      "Outcome/impact notes": r.outcome_impact_notes || "",
      "Remarks": r.remarks || ""
    };
  });
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
        "Year", "Doc. No.", "Name of Agency", "Name of Project", "Date of Approval", "Sanctioned Amount", "Status",
        "Source of Funding", "Funding Type", "Donor Agency Name", "Donor Category",
        "State", "District", "Block/Village/ULB", "Area Type", "Rural Subtype", "Urban Subtype", "Settlement Detail", "Geography Notes",
        "Major Theme", "Sub Theme", "Activity Type",
        "Target Group", "Age Group", "Gender", "Education Stage", "Social Group", "Disability/other vulnerability",
        "No. of beneficiaries", "Direct beneficiaries", "Indirect beneficiaries", "Male", "Female", "Boys", "Girls",
        "Completed/Ongoing", "Duration (Months)", "Outcome/impact notes", "Remarks"
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

// 4. EXPORT TO PDF
router.get("/export/pdf", async (req, res) => {
  try {
    const { query, values } = buildQuery(req);
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No projects found to export." });
    }

    if (result.rows.length >= 10) {
      return res.status(400).json({ success: false, message: "PDF export is only available for below 10 projects." });
    }

    // Helper functions for formatting
    function formatDate(dateStr) {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    }

    function formatAmount(amount) {
      if (amount === null || amount === undefined) return "";
      const num = Number(amount);
      return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=projects_report.pdf");

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    for (let i = 0; i < result.rows.length; i++) {
      if (i > 0) {
        doc.addPage();
      }

      const p = result.rows[i];

      // Fetch all themes associated with the project in order
      const themesRes = await pool.query(
        `SELECT t.theme_name 
         FROM project_themes pt 
         JOIN themes t ON pt.theme_id = t.theme_id 
         WHERE pt.project_id = $1 
         ORDER BY pt.primary_flag DESC, t.theme_id ASC`,
        [p.project_id]
      );
      const themeNames = themesRes.rows.map(r => r.theme_name);

      // Fetch all target groups associated with the project in order
      const targetGroupsRes = await pool.query(
        `SELECT tg.main_group, tg.sub_group 
         FROM project_target_groups ptg 
         JOIN target_groups tg ON ptg.target_group_id = tg.target_group_id 
         WHERE ptg.project_id = $1 
         ORDER BY ptg.primary_group DESC, tg.target_group_id ASC`,
        [p.project_id]
      );
      const targetGroupNames = targetGroupsRes.rows.map(r => `${r.main_group} - ${r.sub_group}`);

      // Fetch all activity types associated with the project
      const activityTypesRes = await pool.query(
        `SELECT at.activity_type_name 
         FROM project_activity_types pat 
         JOIN activity_types at ON pat.activity_type_id = at.activity_type_id 
         WHERE pat.project_id = $1`,
        [p.project_id]
      );
      const activityTypeNames = activityTypesRes.rows.map(r => r.activity_type_name);

      // Fetch all SDGs associated with the project
      const sdgsRes = await pool.query(
        `SELECT s.sdg_code || ' - ' || s.sdg_name as name 
         FROM project_sdgs psdg 
         JOIN sdgs s ON psdg.sdg_id = s.sdg_id 
         WHERE psdg.project_id = $1 
         ORDER BY s.sdg_code ASC`,
        [p.project_id]
      );
      const sdgNames = sdgsRes.rows.map(r => r.name);

      // Title
      doc.fillColor("#000000").font("Helvetica-Bold").fontSize(22).text("Project Details", 50, 40, { align: "center" });

      // Table mapping
      const tableRows = [
        { field: "Year", value: p.year },
        { field: "Document #", value: p.doc_no },
        { field: "Name of Agency", value: p.agency_name },
        { field: "Name of Project", value: p.project_name },
        { field: "Date of Approval", value: formatDate(p.approval_date) },
        { field: "Sanctioned Amount (Rs.)", value: formatAmount(p.sanctioned_amount) },
        { field: "Project Duration", value: p.duration_months ? `${p.duration_months} Months` : "" },
        { field: "Number of Staff", value: p.staff_count ? String(p.staff_count) : "" },
        { field: "Source", value: p.funding_source },
        { field: "Source 2", value: p.funding_source2 },
        { field: "Status", value: p.project_status },
        { field: "State", value: p.state },
        { field: "Primary Theme", value: themeNames[0] || "" },
        { field: "Theme 2", value: themeNames[1] || "" },
        { field: "Theme 3", value: themeNames[2] || "" },
        { field: "Theme 4", value: themeNames[3] || "" },
        { field: "Target Group 1", value: targetGroupNames[0] || "" },
        { field: "Target Group 2", value: targetGroupNames[1] || "" },
        { field: "Target Group 3", value: targetGroupNames[2] || "" },
        { field: "Activity Types", value: activityTypeNames.join(", ") },
        { field: "SDGs", value: sdgNames.join(", ") },
        { field: "Total Beneficiaries", value: p.total_beneficiaries ? String(p.total_beneficiaries) : "" },
        { field: "Direct Beneficiaries", value: p.direct_beneficiaries ? String(p.direct_beneficiaries) : "" },
        { field: "Indirect Beneficiaries", value: p.indirect_beneficiaries ? String(p.indirect_beneficiaries) : "" },
        { field: "Male Beneficiaries", value: p.beneficiaries_male ? String(p.beneficiaries_male) : "" },
        { field: "Female Beneficiaries", value: p.beneficiaries_female ? String(p.beneficiaries_female) : "" },
        { field: "Boys Beneficiaries", value: p.beneficiaries_boys ? String(p.beneficiaries_boys) : "" },
        { field: "Girls Beneficiaries", value: p.beneficiaries_girls ? String(p.beneficiaries_girls) : "" },
        { field: "Project Summary", value: p.project_summary || "" },
        { field: "Outcome & Impact Notes", value: p.outcome_impact_notes || "" }
      ].filter(row => row.value !== null && row.value !== undefined && row.value !== "");

      let y = 80;
      const leftX = 50;
      const col1Width = 175;
      const col2Width = 320;
      const totalWidth = col1Width + col2Width;

      // Table Header Row
      doc.fillColor("#dbeafe").rect(leftX, y, totalWidth, 24).fill();
      doc.strokeColor("#cbd5e1").lineWidth(1)
         .rect(leftX, y, col1Width, 24).stroke()
         .rect(leftX + col1Width, y, col2Width, 24).stroke();

      doc.fillColor("#1e3a8a").font("Helvetica-Bold").fontSize(10);
      doc.text("Field", leftX + 8, y + 7);
      doc.text("Value", leftX + col1Width + 8, y + 7);
      y += 24;

      // Body Rows
      for (const row of tableRows) {
        const valText = String(row.value || "");
        const valueHeight = doc.heightOfString(valText, { width: col2Width - 16 });
        const rowHeight = Math.max(22, valueHeight + 10);

        // Check page overflow
        if (y + rowHeight > 750) {
          doc.addPage();
          y = 50; // top margin
          
          // Re-draw table header row on new page
          doc.fillColor("#dbeafe").rect(leftX, y, totalWidth, 24).fill();
          doc.strokeColor("#cbd5e1").lineWidth(1)
             .rect(leftX, y, col1Width, 24).stroke()
             .rect(leftX + col1Width, y, col2Width, 24).stroke();
          doc.fillColor("#1e3a8a").font("Helvetica-Bold").fontSize(10);
          doc.text("Field", leftX + 8, y + 7);
          doc.text("Value", leftX + col1Width + 8, y + 7);
          y += 24;
        }

        // Draw background for field column
        doc.fillColor("#f8fafc").rect(leftX, y, col1Width, rowHeight).fill();
        
        // Draw borders
        doc.strokeColor("#cbd5e1").lineWidth(1)
           .rect(leftX, y, col1Width, rowHeight).stroke()
           .rect(leftX + col1Width, y, col2Width, rowHeight).stroke();

        // Field Text
        doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(9);
        doc.text(row.field, leftX + 8, y + 6, { width: col1Width - 16 });

        // Value Text
        doc.fillColor("#334155").font("Helvetica").fontSize(9);
        doc.text(valText, leftX + col1Width + 8, y + 6, { width: col2Width - 16 });

        y += rowHeight;
      }
    }

    doc.end();
  } catch (error) {
    console.error("PDF Export Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. GET ALL AGENCIES SUMMARY FOR EXCEL DASHBOARD TABLE
router.get("/agencies/summary", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.agency_id,
        a.agency_name,
        COUNT(p.project_id)::integer AS total_projects,
        COALESCE(SUM(p.sanctioned_amount), 0)::numeric AS total_sanctioned,
        COUNT(CASE WHEN p.classification_status = 'Completed' THEN 1 END)::integer AS completed_projects,
        COUNT(CASE WHEN p.classification_status = 'Pending' THEN 1 END)::integer AS pending_projects,
        (
          SELECT t.theme_name
          FROM project_themes pt2
          JOIN themes t ON pt2.theme_id = t.theme_id
          WHERE pt2.project_id IN (
            SELECT project_id FROM projects WHERE agency_id = a.agency_id AND is_archived = false
          )
          GROUP BY t.theme_name
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS primary_theme
      FROM agencies a
      LEFT JOIN projects p ON p.agency_id = a.agency_id AND p.is_archived = false
      GROUP BY a.agency_id, a.agency_name
      ORDER BY total_projects DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Agency Summary Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. GET PER-AGENCY DETAILED STATS FOR SELECTED AGENCY CHARTS
router.get("/agency/:agency_id/stats", async (req, res) => {
  try {
    const agencyId = Number(req.params.agency_id);

    // Agency info
    const agencyRes = await pool.query(
      `SELECT agency_id, agency_name FROM agencies WHERE agency_id = $1`,
      [agencyId]
    );
    if (agencyRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Agency not found" });
    }

    // Summary stats
    const summaryRes = await pool.query(`
      SELECT
        COUNT(*)::integer AS total_projects,
        COALESCE(SUM(sanctioned_amount), 0)::numeric AS total_sanctioned,
        COUNT(CASE WHEN classification_status = 'Completed' THEN 1 END)::integer AS completed,
        COUNT(CASE WHEN classification_status = 'Pending' THEN 1 END)::integer AS pending,
        COALESCE(AVG(duration_months), 0)::numeric AS avg_duration
      FROM projects
      WHERE agency_id = $1 AND is_archived = false
    `, [agencyId]);

    // Projects by year (bar chart)
    const byYearRes = await pool.query(`
      SELECT year, COUNT(*)::integer AS count
      FROM projects
      WHERE agency_id = $1 AND is_archived = false AND year IS NOT NULL AND year <> ''
      GROUP BY year
      ORDER BY year ASC
    `, [agencyId]);

    // Sanctioned amount by year (line chart)
    const amountByYearRes = await pool.query(`
      SELECT year, COALESCE(SUM(sanctioned_amount), 0)::numeric AS amount
      FROM projects
      WHERE agency_id = $1 AND is_archived = false AND year IS NOT NULL AND year <> ''
      GROUP BY year
      ORDER BY year ASC
    `, [agencyId]);

    // Theme distribution (pie chart)
    const themeRes = await pool.query(`
      SELECT t.theme_name AS name, COUNT(pt.project_id)::integer AS value
      FROM project_themes pt
      JOIN themes t ON pt.theme_id = t.theme_id
      JOIN projects p ON pt.project_id = p.project_id
      WHERE p.agency_id = $1 AND p.is_archived = false
      GROUP BY t.theme_name
      ORDER BY value DESC
    `, [agencyId]);

    // Status breakdown (donut chart)
    const statusRes = await pool.query(`
      SELECT classification_status AS name, COUNT(*)::integer AS value
      FROM projects
      WHERE agency_id = $1 AND is_archived = false
      GROUP BY classification_status
    `, [agencyId]);

    // Recent projects list
    const projectsRes = await pool.query(`
      SELECT
        p.project_id,
        p.project_name,
        p.year,
        p.sanctioned_amount,
        p.classification_status,
        ps.status_name AS project_status,
        COALESCE(
          (SELECT STRING_AGG(t.theme_name, ', ') FROM project_themes pt JOIN themes t ON pt.theme_id = t.theme_id WHERE pt.project_id = p.project_id),
          'Unclassified'
        ) AS themes
      FROM projects p
      LEFT JOIN project_status ps ON p.status_id = ps.status_id
      WHERE p.agency_id = $1 AND p.is_archived = false
      ORDER BY p.project_id DESC
      LIMIT 15
    `, [agencyId]);

    res.json({
      success: true,
      agency: agencyRes.rows[0],
      summary: summaryRes.rows[0],
      byYear: byYearRes.rows,
      amountByYear: amountByYearRes.rows,
      themeDistribution: themeRes.rows,
      statusBreakdown: statusRes.rows,
      recentProjects: projectsRes.rows
    });
  } catch (error) {
    console.error("Agency Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;


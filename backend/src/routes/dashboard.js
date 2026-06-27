const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Helper function to dynamically construct the year filter
function getYearFilter(yearsParam, tableAlias = "") {
  if (!yearsParam) return { filter: "", values: [] };
  const yearList = yearsParam.split(",").map(y => y.trim()).filter(Boolean);
  if (yearList.length === 0) return { filter: "", values: [] };

  const prefix = tableAlias ? `${tableAlias}.` : "";
  const filter = ` AND ${prefix}year IN (${yearList.map((_, idx) => `$${idx + 1}`).join(",")}) `;
  return { filter, values: yearList };
}

router.get("/summary", async (req, res) => {
  try {
    const { filter, values } = getYearFilter(req.query.years);

    const totalProjects = await pool.query(`
      SELECT COUNT(*) FROM projects WHERE 1=1 ${filter}
    `, values);

    const pendingProjects = await pool.query(`
      SELECT COUNT(*)
      FROM projects
      WHERE classification_status = 'Pending' ${filter}
    `, values);

    const completedProjects = await pool.query(`
      SELECT COUNT(*)
      FROM projects
      WHERE classification_status = 'Completed' ${filter}
    `, values);

    // Static counts
    const totalThemes = await pool.query(`SELECT COUNT(*) FROM themes`);
    const totalAgencies = await pool.query(`SELECT COUNT(*) FROM agencies`);

    const aiClassified = await pool.query(`
      SELECT COUNT(*)
      FROM projects
      WHERE classification_status = 'Completed' AND classification_method = 'AI' AND is_archived = false ${filter}
    `, values);

    const manualClassified = await pool.query(`
      SELECT COUNT(*)
      FROM projects
      WHERE classification_status = 'Completed' AND classification_method = 'Manual' AND is_archived = false ${filter}
    `, values);

    const totalSanctioned = await pool.query(`
      SELECT SUM(sanctioned_amount) FROM projects WHERE is_archived = false ${filter}
    `, values);

    res.json({
      totalProjects: Number(totalProjects.rows[0].count),
      pendingProjects: Number(pendingProjects.rows[0].count),
      completedProjects: Number(completedProjects.rows[0].count),
      totalThemes: Number(totalThemes.rows[0].count),
      totalAgencies: Number(totalAgencies.rows[0].count),
      aiClassifiedProjects: Number(aiClassified.rows[0].count),
      manualClassifiedProjects: Number(manualClassified.rows[0].count),
      totalSanctionedAmount: Number(totalSanctioned.rows[0].sum || 0)
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({
      message: error.message
    });
  }
});

router.get("/charts", async (req, res) => {
  try {
    const { filter, values } = getYearFilter(req.query.years, "p");

    // 1. Projects by Theme (Primary Theme)
    const themeRes = await pool.query(`
      SELECT t.theme_name, COUNT(p.project_id)::integer as count
      FROM projects p
      JOIN project_themes pt ON p.project_id = pt.project_id AND pt.primary_flag = true
      JOIN themes t ON pt.theme_id = t.theme_id
      WHERE 1=1 ${filter}
      GROUP BY t.theme_name
      ORDER BY count DESC
    `, values);

    // 2. Projects by Year
    const yearRes = await pool.query(`
      SELECT p.year, COUNT(p.project_id)::integer as count
      FROM projects p
      WHERE p.year IS NOT NULL AND p.year <> '' ${filter}
      GROUP BY p.year
      ORDER BY p.year ASC
    `, values);

    // 3. Projects by Agency (Top 10)
    const agencyRes = await pool.query(`
      SELECT a.agency_name, COUNT(p.project_id)::integer as count
      FROM projects p
      JOIN agencies a ON p.agency_id = a.agency_id
      WHERE 1=1 ${filter}
      GROUP BY a.agency_name
      ORDER BY count DESC
      LIMIT 10
    `, values);

    // 4. Projects by State
    const stateRes = await pool.query(`
      SELECT s.state_name, COUNT(p.project_id)::integer as count
      FROM projects p
      JOIN states s ON p.state_id = s.state_id
      WHERE 1=1 ${filter}
      GROUP BY s.state_name
      ORDER BY count DESC
    `, values);

    // 5. Projects by Classification Status
    const statusRes = await pool.query(`
      SELECT classification_status, COUNT(*)::integer as count
      FROM projects p
      WHERE 1=1 ${filter}
      GROUP BY classification_status
    `, values);

    // 6. Funding Source Distribution (Top 10)
    const fundingRes = await pool.query(`
      SELECT fs.source_name, COUNT(p.project_id)::integer as count
      FROM projects p
      JOIN funding_sources fs ON p.funding_source_id = fs.funding_source_id
      WHERE 1=1 ${filter}
      GROUP BY fs.source_name
      ORDER BY count DESC
      LIMIT 10
    `, values);

    // 7. Total Turnover every year
    const turnoverRes = await pool.query(`
      SELECT p.year, COALESCE(SUM(p.sanctioned_amount), 0)::numeric as turnover
      FROM projects p
      WHERE p.year IS NOT NULL AND p.year <> '' AND p.is_archived = false ${filter}
      GROUP BY p.year
      ORDER BY p.year ASC
    `, values);

    // 8. Themes with their frequencies
    const frequencyRes = await pool.query(`
      SELECT t.theme_name, COUNT(pt.project_id)::integer as count
      FROM project_themes pt
      JOIN themes t ON pt.theme_id = t.theme_id
      JOIN projects p ON pt.project_id = p.project_id AND p.is_archived = false ${filter}
      GROUP BY t.theme_name
      ORDER BY count DESC
    `, values);

    res.json({
      projectsByTheme: themeRes.rows,
      projectsByYear: yearRes.rows,
      projectsByAgency: agencyRes.rows,
      projectsByState: stateRes.rows,
      projectsByStatus: statusRes.rows,
      fundingSourceDistribution: fundingRes.rows,
      turnoverByYear: turnoverRes.rows,
      themesFrequency: frequencyRes.rows
    });
  } catch (error) {
    console.error("Dashboard Charts Error:", error);
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;
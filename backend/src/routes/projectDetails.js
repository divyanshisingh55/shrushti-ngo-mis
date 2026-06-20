const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const projectRes = await pool.query(
      `SELECT p.*, a.agency_name, s.state_name, fs.source_name as funding_source, ps.status_name as project_status
       FROM projects p
       LEFT JOIN agencies a ON p.agency_id = a.agency_id
       LEFT JOIN states s ON p.state_id = s.state_id
       LEFT JOIN funding_sources fs ON p.funding_source_id = fs.funding_source_id
       LEFT JOIN project_status ps ON p.status_id = ps.status_id
       WHERE p.project_id = $1`,
      [id]
    );

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const project = projectRes.rows[0];

    // Fetch primary theme
    const themeRes = await pool.query(
      `SELECT theme_id FROM project_themes WHERE project_id = $1 AND primary_flag = true LIMIT 1`,
      [id]
    );
    const themeId = themeRes.rows.length > 0 ? themeRes.rows[0].theme_id : null;

    // Fetch sub themes
    const subThemesRes = await pool.query(
      `SELECT sub_theme_id FROM project_sub_themes WHERE project_id = $1`,
      [id]
    );
    const subThemeIds = subThemesRes.rows.map(row => row.sub_theme_id);

    // Fetch target groups
    const targetGroupsRes = await pool.query(
      `SELECT target_group_id FROM project_target_groups WHERE project_id = $1`,
      [id]
    );
    const targetGroupIds = targetGroupsRes.rows.map(row => row.target_group_id);

    // Fetch activity types
    const activityTypesRes = await pool.query(
      `SELECT activity_type_id FROM project_activity_types WHERE project_id = $1`,
      [id]
    );
    const activityTypeIds = activityTypesRes.rows.map(row => row.activity_type_id);

    res.json({
      ...project,
      classification: {
        theme_id: themeId,
        sub_theme_ids: subThemeIds,
        target_group_ids: targetGroupIds,
        activity_type_ids: activityTypeIds
      }
    });

  } catch (error) {
    console.error("Fetch Project Details Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
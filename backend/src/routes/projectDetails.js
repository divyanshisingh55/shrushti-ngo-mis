const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const projectRes = await pool.query(
      `SELECT p.*, a.agency_name, s.state_name, 
              fs1.source_name as funding_source, 
              fs2.source_name as funding_source2, 
              t1.theme_name as theme1, 
              t2.theme_name as theme2, 
              ps.status_name as project_status
       FROM projects p
       LEFT JOIN agencies a ON p.agency_id = a.agency_id
       LEFT JOIN states s ON p.state_id = s.state_id
       LEFT JOIN funding_sources fs1 ON p.funding_source_id = fs1.funding_source_id
       LEFT JOIN funding_sources fs2 ON p.funding_source2_id = fs2.funding_source_id
       LEFT JOIN themes t1 ON p.theme1_id = t1.theme_id
       LEFT JOIN themes t2 ON p.theme2_id = t2.theme_id
       LEFT JOIN project_status ps ON p.status_id = ps.status_id
       WHERE p.project_id = $1`,
      [id]
    );

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const project = projectRes.rows[0];

    // Fetch states
    const statesRes = await pool.query(
      `SELECT state_id FROM project_states WHERE project_id = $1`,
      [id]
    );
    const stateIds = statesRes.rows.map(row => row.state_id);

    // Fetch project themes (all of them)
    const themesRes = await pool.query(
      `SELECT theme_id, primary_flag FROM project_themes WHERE project_id = $1`,
      [id]
    );
    
    // Fetch project sub themes with their associated theme_id from sub_themes table
    const subThemesMapRes = await pool.query(
      `SELECT pst.sub_theme_id, st.theme_id 
       FROM project_sub_themes pst
       JOIN sub_themes st ON pst.sub_theme_id = st.sub_theme_id
       WHERE pst.project_id = $1`,
      [id]
    );

    const primaryThemeRow = themesRes.rows.find(row => row.primary_flag) || themesRes.rows[0];
    const primaryThemeId = primaryThemeRow ? primaryThemeRow.theme_id : null;

    // Group subtheme IDs by theme_id
    const themesMap = {};
    for (const t of themesRes.rows) {
      themesMap[t.theme_id] = [];
    }
    for (const st of subThemesMapRes.rows) {
      if (!themesMap[st.theme_id]) {
        themesMap[st.theme_id] = [];
      }
      themesMap[st.theme_id].push(st.sub_theme_id);
    }

    const themesList = Object.keys(themesMap).map(tId => ({
      themeId: Number(tId),
      subThemeIds: themesMap[tId]
    }));

    const allSubThemeIds = subThemesMapRes.rows.map(row => row.sub_theme_id);

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

    // Fetch SDGs
    const sdgsRes = await pool.query(
      `SELECT sdg_id FROM project_sdgs WHERE project_id = $1`,
      [id]
    );
    const sdgIds = sdgsRes.rows.map(row => row.sdg_id);

    res.json({
      ...project,
      state_ids: stateIds,
      classification: {
        theme_id: primaryThemeId,
        sub_theme_ids: allSubThemeIds,
        target_group_ids: targetGroupIds,
        activity_type_ids: activityTypeIds,
        themes: themesList,
        sdg_ids: sdgIds
      }
    });

  } catch (error) {
    console.error("Fetch Project Details Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
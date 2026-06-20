const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.post("/:id", async (req, res) => {
  const projectId = req.params.id;
  const {
    themeId,
    subThemeIds = [],
    targetGroupIds = [],
    activityTypeIds = []
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Delete existing classifications for this project
    await client.query("DELETE FROM project_themes WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM project_sub_themes WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM project_target_groups WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM project_activity_types WHERE project_id = $1", [projectId]);

    // 2. Insert primary theme if provided
    if (themeId) {
      await client.query(
        `INSERT INTO project_themes (project_id, theme_id, primary_flag)
         VALUES ($1, $2, true)`,
        [projectId, themeId]
      );
    }

    // 3. Insert multiple sub-themes
    if (Array.isArray(subThemeIds) && subThemeIds.length > 0) {
      for (const stId of subThemeIds) {
        await client.query(
          `INSERT INTO project_sub_themes (project_id, sub_theme_id)
           VALUES ($1, $2)`,
          [projectId, stId]
        );
      }
    }

    // 4. Insert multiple target groups
    if (Array.isArray(targetGroupIds) && targetGroupIds.length > 0) {
      for (const tgId of targetGroupIds) {
        await client.query(
          `INSERT INTO project_target_groups (project_id, target_group_id, primary_group)
           VALUES ($1, $2, false)`,
          [projectId, tgId]
        );
      }
    }

    // 5. Insert multiple activity types
    if (Array.isArray(activityTypeIds) && activityTypeIds.length > 0) {
      for (const atId of activityTypeIds) {
        await client.query(
          `INSERT INTO project_activity_types (project_id, activity_type_id)
           VALUES ($1, $2)`,
          [projectId, atId]
        );
      }
    }

    // 6. Update project status
    // Classification is considered complete if a primary theme is selected
    const status = themeId ? 'Completed' : 'Pending';
    await client.query(
      `UPDATE projects
       SET classification_status = $1, updated_at = NOW()
       WHERE project_id = $2`,
      [status, projectId]
    );

    await client.query("COMMIT");
    res.json({
      success: true,
      message: "Classification Saved Successfully"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("CLASSIFICATION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.post("/:id", async (req, res) => {
  const projectId = req.params.id;
  const {
    themeId,
    subThemeIds = [],
    targetGroupIds = [],
    activityTypeIds = [],
    themes = [], // [{ themeId, subThemeIds }]
    sdgIds = [],
    projectSummary = '',
    beneficiaryGroups = [],
    beneficiaryCat1 = [],
    beneficiaryCat2 = [],
    beneficiaryCat3 = [],
    beneficiaryCat4 = [],
    ageGroups = []
  } = req.body;

  let finalThemes = themes;
  if ((!finalThemes || finalThemes.length === 0) && themeId) {
    finalThemes = [{ themeId, subThemeIds }];
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Delete existing classifications for this project
    await client.query("DELETE FROM project_themes WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM project_sub_themes WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM project_target_groups WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM project_activity_types WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM project_sdgs WHERE project_id = $1", [projectId]);

    // 2. Insert multiple themes and their sub-themes
    if (Array.isArray(finalThemes) && finalThemes.length > 0) {
      let isFirst = true;
      for (const t of finalThemes) {
        if (!t.themeId) continue;
        await client.query(
          `INSERT INTO project_themes (project_id, theme_id, primary_flag)
           VALUES ($1, $2, $3)`,
          [projectId, t.themeId, isFirst]
        );
        isFirst = false;
        
        // Insert sub-themes
        if (Array.isArray(t.subThemeIds) && t.subThemeIds.length > 0) {
          for (const stId of t.subThemeIds) {
            await client.query(
              `INSERT INTO project_sub_themes (project_id, sub_theme_id)
               VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [projectId, stId]
            );
          }
        }
      }
    }

    // 3. Insert multiple target groups
    if (Array.isArray(targetGroupIds) && targetGroupIds.length > 0) {
      for (const tgId of targetGroupIds) {
        await client.query(
          `INSERT INTO project_target_groups (project_id, target_group_id, primary_group)
           VALUES ($1, $2, false)`,
          [projectId, tgId]
        );
      }
    }

    // 4. Insert multiple activity types
    if (Array.isArray(activityTypeIds) && activityTypeIds.length > 0) {
      for (const atId of activityTypeIds) {
        await client.query(
          `INSERT INTO project_activity_types (project_id, activity_type_id)
           VALUES ($1, $2)`,
          [projectId, atId]
        );
      }
    }

    // 5. Insert SDGs
    if (Array.isArray(sdgIds) && sdgIds.length > 0) {
      for (const sdgId of sdgIds) {
        await client.query(
          `INSERT INTO project_sdgs (project_id, sdg_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [projectId, sdgId]
        );
      }
    }

    // 6. Update project status and details columns
    const hasTheme = finalThemes.length > 0 && finalThemes[0].themeId;
    const status = hasTheme ? 'Completed' : 'Pending';

    // Format fields to string
    const bgStr = Array.isArray(beneficiaryGroups) ? beneficiaryGroups.join(',') : (beneficiaryGroups || '');
    const c1Str = Array.isArray(beneficiaryCat1) ? beneficiaryCat1.join(',') : (beneficiaryCat1 || '');
    const c2Str = Array.isArray(beneficiaryCat2) ? beneficiaryCat2.join(',') : (beneficiaryCat2 || '');
    const c3Str = Array.isArray(beneficiaryCat3) ? beneficiaryCat3.join(',') : (beneficiaryCat3 || '');
    const c4Str = Array.isArray(beneficiaryCat4) ? beneficiaryCat4.join(',') : (beneficiaryCat4 || '');
    const agStr = Array.isArray(ageGroups) ? ageGroups.join(',') : (ageGroups || '');

    await client.query(
      `UPDATE projects
       SET classification_status = $1, 
           project_summary = $2,
           beneficiary_groups = $3,
           beneficiary_cat1 = $4,
           beneficiary_cat2 = $5,
           beneficiary_cat3 = $6,
           beneficiary_cat4 = $7,
           age_groups = $8,
           updated_at = NOW()
       WHERE project_id = $9`,
      [status, projectSummary || null, bgStr || null, c1Str || null, c2Str || null, c3Str || null, c4Str || null, agStr || null, projectId]
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
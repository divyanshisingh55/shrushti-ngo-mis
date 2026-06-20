const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.post("/:id", async (req, res) => {

  try {

    const projectId = req.params.id;

    const {
      themeId,
      subThemeId,
      activityTypeId,
      targetGroupId
    } = req.body;

    console.log("Received Data:");
    console.log({
      projectId,
      themeId,
      subThemeId,
      activityTypeId,
      targetGroupId
    });

    // Save Theme Classification
    await pool.query(
      `
      INSERT INTO project_themes
      (
        project_id,
        theme_id,
        sub_theme_id,
        activity_type_id,
        primary_flag
      )
      VALUES
      ($1,$2,$3,$4,true)
      `,
      [
        projectId,
        themeId,
        subThemeId,
        activityTypeId
      ]
    );

    // Save Target Group
    await pool.query(
      `
      INSERT INTO project_target_groups
      (
        project_id,
        target_group_id,
        primary_group
      )
      VALUES
      ($1,$2,true)
      `,
      [
        projectId,
        targetGroupId
      ]
    );

    // Mark Project Complete
    await pool.query(
      `
      UPDATE projects
      SET classification_status = 'Completed'
      WHERE project_id = $1
      `,
      [projectId]
    );

    res.json({
      success: true,
      message: "Classification Saved Successfully"
    });

  } catch (error) {

    console.error("CLASSIFICATION ERROR:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

module.exports = router;
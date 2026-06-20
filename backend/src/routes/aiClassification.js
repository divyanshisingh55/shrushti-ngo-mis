const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Helper to perform local rule-based heuristic classification
function localHeuristicClassification(projectName, remarks, themesList, subThemesList, targetGroupsList, activityTypesList) {
  const content = `${projectName || ''} ${remarks || ''}`.toLowerCase();
  
  let themeId = null;
  let themeName = "";
  let subThemeIds = [];
  let targetGroupIds = [];
  let activityTypeIds = [];
  let confidence = 50; // baseline

  // 1. Determine Theme
  const eduKeywords = ["education", "school", "student", "learning", "classroom", "career", "youth", "leadership", "college", "teachers", "academy"];
  const healthKeywords = ["health", "nutrition", "pregnant", "mother", "lactating", "eye", "vision", "wash", "sanitation", "hygiene", "toilet", "water", "asha", "medical", "clinic"];
  const livelihoodKeywords = ["livelihood", "skill", "entrepreneur", "business", "vocational", "self help", "shg", "women", "craft", "tailor"];
  const agriKeywords = ["agriculture", "farmer", "crop", "seed", "nature", "tree", "plant", "climate", "environment", "biodiversity", "conservation", "organic"];
  const childKeywords = ["child", "marriage", "labor", "protection", "pocso", "welfare", "rescue"];

  let eduMatches = eduKeywords.filter(k => content.includes(k)).length;
  let healthMatches = healthKeywords.filter(k => content.includes(k)).length;
  let livelihoodMatches = livelihoodKeywords.filter(k => content.includes(k)).length;
  let agriMatches = agriKeywords.filter(k => content.includes(k)).length;
  let childMatches = childKeywords.filter(k => content.includes(k)).length;

  const matches = [
    { name: "Education & Youth Development", count: eduMatches },
    { name: "Health, Nutrition & WASH", count: healthMatches },
    { name: "Livelihood & Skill Development", count: livelihoodMatches },
    { name: "Agriculture, Climate & Environment", count: agriMatches },
    { name: "Child Protection & Child Rights", count: childMatches }
  ];

  matches.sort((a, b) => b.count - a.count);
  const bestMatch = matches[0];

  if (bestMatch.count > 0) {
    const t = themesList.find(x => x.theme_name.toLowerCase().includes(bestMatch.name.toLowerCase().split("&")[0].trim().toLowerCase()));
    if (t) {
      themeId = t.theme_id;
      themeName = t.theme_name;
      confidence += Math.min(30, bestMatch.count * 10);
    }
  }

  if (!themeId && themesList.length > 0) {
    // Fallback to first theme
    themeId = themesList[0].theme_id;
    themeName = themesList[0].theme_name;
  }

  // 2. Determine Sub Themes (filtered by selected theme if present)
  if (themeId) {
    const filteredSubThemes = subThemesList.filter(st => st.theme_id === themeId);
    for (const st of filteredSubThemes) {
      const nameParts = st.sub_theme_name.toLowerCase().split(" ");
      const matchesName = nameParts.some(p => p.length > 3 && content.includes(p));
      if (matchesName) {
        subThemeIds.push(st.sub_theme_id);
      }
    }
    // Fallback if none found
    if (subThemeIds.length === 0 && filteredSubThemes.length > 0) {
      subThemeIds.push(filteredSubThemes[0].sub_theme_id);
    }
  }

  // 3. Determine Target Groups
  for (const tg of targetGroupsList) {
    const mainLower = tg.main_group.toLowerCase();
    const subLower = tg.sub_group.toLowerCase();
    if (content.includes(mainLower) || content.includes(subLower)) {
      targetGroupIds.push(tg.target_group_id);
    }
  }
  // limit to max 3
  targetGroupIds = targetGroupIds.slice(0, 3);
  if (targetGroupIds.length === 0 && targetGroupsList.length > 0) {
    targetGroupIds.push(targetGroupsList[0].target_group_id);
  }

  // 4. Determine Activity Types
  for (const at of activityTypesList) {
    const nameLower = at.activity_type_name.toLowerCase();
    const nameParts = nameLower.split(" ");
    if (nameParts.some(p => p.length > 3 && content.includes(p))) {
      activityTypeIds.push(at.activity_type_id);
    }
  }
  activityTypeIds = activityTypeIds.slice(0, 2);
  if (activityTypeIds.length === 0 && activityTypesList.length > 0) {
    activityTypeIds.push(activityTypesList[0].activity_type_id);
  }

  confidence = Math.min(95, confidence);

  const themeConfidence = themeId ? confidence : 0;
  const subThemeConfidence = subThemeIds.length > 0 ? Math.max(0, Math.min(90, confidence - 5)) : 0;
  const targetGroupConfidence = targetGroupIds.length > 0 ? Math.max(0, Math.min(85, confidence - 10)) : 0;
  const activityConfidence = activityTypeIds.length > 0 ? Math.max(0, Math.min(80, confidence - 15)) : 0;

  return {
    themeId,
    themeName,
    subThemeIds,
    targetGroupIds,
    activityTypeIds,
    confidence,
    themeConfidence,
    subThemeConfidence,
    targetGroupConfidence,
    activityConfidence
  };
}

// 1. Single Project AI classification suggestions
router.post("/:id/suggest", async (req, res) => {
  const { id } = req.params;
  try {
    const projRes = await pool.query("SELECT * FROM projects WHERE project_id = $1", [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    const project = projRes.rows[0];

    // Fetch lists from database
    const [themesRes, subThemesRes, targetGroupsRes, activityTypesRes] = await Promise.all([
      pool.query("SELECT * FROM themes"),
      pool.query("SELECT * FROM sub_themes"),
      pool.query("SELECT * FROM target_groups"),
      pool.query("SELECT * FROM activity_types")
    ]);

    const themes = themesRes.rows;
    const subThemes = subThemesRes.rows;
    const targetGroups = targetGroupsRes.rows;
    const activityTypes = activityTypesRes.rows;

    let suggestion = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
          You are an expert AI classifying NGO projects for the Shrushti NGO MIS system.
          Given the following project details:
          Project Name: ${project.project_name}
          Description/Remarks: ${project.remarks || ""}

          Classify this project under the primary thematic area, sub-themes, target beneficiary groups, and activity types.
          Select ONLY from the following allowed categories list:

          === ALLOWED THEMES ===
          ${JSON.stringify(themes.map(t => ({ id: t.theme_id, name: t.theme_name })))}

          === ALLOWED SUB-THEMES ===
          ${JSON.stringify(subThemes.map(st => ({ id: st.sub_theme_id, name: st.sub_theme_name, themeId: st.theme_id })))}

          === ALLOWED TARGET GROUPS ===
          ${JSON.stringify(targetGroups.map(tg => ({ id: tg.target_group_id, label: `${tg.main_group} - ${tg.sub_group}` })))}

          === ALLOWED ACTIVITY TYPES ===
          ${JSON.stringify(activityTypes.map(at => ({ id: at.activity_type_id, name: at.activity_type_name })))}

           Return the suggestions strictly in JSON format matching this structure:
          {
            "themeId": 1,
            "themeConfidence": 95,
            "subThemeIds": [1, 2],
            "subThemeConfidence": 88,
            "targetGroupIds": [3, 4],
            "targetGroupConfidence": 90,
            "activityTypeIds": [1],
            "activityConfidence": 85,
            "confidence": 92
          }
          Ensure that:
          1. "themeId" exactly matches one of the IDs in the Allowed Themes list.
          2. "subThemeIds" matches IDs from the Allowed Sub-themes list.
          3. "targetGroupIds" matches IDs from the Allowed Target Groups list.
          4. "activityTypeIds" matches IDs from the Allowed Activity Types list.
          5. Provide realistic integer confidence percentages from 0 to 100 for each classification and the overall confidence.
          Return ONLY the raw JSON string. Do not include markdown formatting.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const responseJson = JSON.parse(text);

        suggestion = {
          themeId: responseJson.themeId,
          themeName: themes.find(t => t.theme_id === responseJson.themeId)?.theme_name || "",
          themeConfidence: responseJson.themeConfidence || responseJson.confidence || 80,
          subThemeIds: responseJson.subThemeIds || [],
          subThemeConfidence: responseJson.subThemeConfidence || responseJson.confidence || 75,
          targetGroupIds: responseJson.targetGroupIds || [],
          targetGroupConfidence: responseJson.targetGroupConfidence || responseJson.confidence || 75,
          activityTypeIds: responseJson.activityTypeIds || [],
          activityConfidence: responseJson.activityConfidence || responseJson.confidence || 70,
          confidence: responseJson.confidence || 80
        };

      } catch (err) {
        console.error("Gemini API Error, falling back to local heuristic classifier:", err);
      }
    }

    if (!suggestion) {
      suggestion = localHeuristicClassification(
        project.project_name,
        project.remarks,
        themes,
        subThemes,
        targetGroups,
        activityTypes
      );
    }

    const needsReview = suggestion.confidence < 70;

    res.json({
      success: true,
      projectId: Number(id),
      projectName: project.project_name,
      suggestion,
      needsReview
    });

  } catch (error) {
    console.error("Suggest Classification Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Bulk Project AI classification suggestions
router.post("/bulk-suggest", async (req, res) => {
  const { projectIds = [] } = req.body;
  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    return res.status(400).json({ success: false, message: "Project IDs array is required" });
  }

  try {
    const [themesRes, subThemesRes, targetGroupsRes, activityTypesRes] = await Promise.all([
      pool.query("SELECT * FROM themes"),
      pool.query("SELECT * FROM sub_themes"),
      pool.query("SELECT * FROM target_groups"),
      pool.query("SELECT * FROM activity_types")
    ]);

    const themes = themesRes.rows;
    const subThemes = subThemesRes.rows;
    const targetGroups = targetGroupsRes.rows;
    const activityTypes = activityTypesRes.rows;

    const suggestions = [];

    for (const id of projectIds) {
      const projRes = await pool.query("SELECT project_id, project_name, remarks FROM projects WHERE project_id = $1", [id]);
      if (projRes.rows.length === 0) continue;
      const project = projRes.rows[0];

      // Standard local execution for bulk (faster, avoids API rate limits)
      const suggestion = localHeuristicClassification(
        project.project_name,
        project.remarks,
        themes,
        subThemes,
        targetGroups,
        activityTypes
      );

      suggestions.push({
        projectId: project.project_id,
        projectName: project.project_name,
        suggestion,
        needsReview: suggestion.confidence < 70
      });
    }

    res.json({
      success: true,
      count: suggestions.length,
      suggestions
    });
  } catch (error) {
    console.error("Bulk Suggest Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Bulk save suggested classifications
router.post("/bulk-save", async (req, res) => {
  const { classifications = [] } = req.body;
  if (!Array.isArray(classifications) || classifications.length === 0) {
    return res.status(400).json({ success: false, message: "Classifications array is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const item of classifications) {
      const { projectId, themeId, subThemeIds = [], targetGroupIds = [], activityTypeIds = [] } = item;
      
      if (!projectId || !themeId) continue;

      // Clean old classifications
      await client.query("DELETE FROM project_themes WHERE project_id = $1", [projectId]);
      await client.query("DELETE FROM project_sub_themes WHERE project_id = $1", [projectId]);
      await client.query("DELETE FROM project_target_groups WHERE project_id = $1", [projectId]);
      await client.query("DELETE FROM project_activity_types WHERE project_id = $1", [projectId]);

      // Primary theme
      await client.query(
        "INSERT INTO project_themes (project_id, theme_id, primary_flag) VALUES ($1, $2, true)",
        [projectId, themeId]
      );

      // Sub themes
      for (const stId of subThemeIds) {
        await client.query(
          "INSERT INTO project_sub_themes (project_id, sub_theme_id) VALUES ($1, $2)",
          [projectId, stId]
        );
      }

      // Target groups
      for (const tgId of targetGroupIds) {
        await client.query(
          "INSERT INTO project_target_groups (project_id, target_group_id, primary_group) VALUES ($1, $2, false)",
          [projectId, tgId]
        );
      }

      // Activity types
      for (const atId of activityTypeIds) {
        await client.query(
          "INSERT INTO project_activity_types (project_id, activity_type_id) VALUES ($1, $2)",
          [projectId, atId]
        );
      }

      // Update status & method
      await client.query(
        `UPDATE projects 
         SET classification_status = 'Completed', classification_method = 'AI', updated_at = NOW() 
         WHERE project_id = $1`,
        [projectId]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Bulk classifications saved successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Bulk Save Error:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;

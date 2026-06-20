require("dotenv").config();
const pool = require("./db");
const XLSX = require("xlsx");
const path = require("path");

const EXCEL_PATH = path.join(__dirname, "..", "..", "Project Dashboard_15-06-2026.xlsx");

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting database migration...");
    
    // Start Transaction for schema changes
    await client.query("BEGIN");
    
    // 1. Create junction table for sub themes
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_sub_themes (
        project_sub_theme_id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
        sub_theme_id INTEGER REFERENCES sub_themes(sub_theme_id) ON DELETE CASCADE,
        CONSTRAINT unique_project_sub_theme UNIQUE (project_id, sub_theme_id)
      )
    `);
    console.log("✅ Table 'project_sub_themes' verified/created");

    // 2. Create junction table for activity types
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_activity_types (
        project_activity_type_id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
        activity_type_id INTEGER REFERENCES activity_types(activity_type_id) ON DELETE CASCADE,
        CONSTRAINT unique_project_activity UNIQUE (project_id, activity_type_id)
      )
    `);
    console.log("✅ Table 'project_activity_types' verified/created");

    // 3. Add state_id to projects if it does not exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'state_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE projects 
        ADD COLUMN state_id INTEGER REFERENCES states(state_id) ON DELETE SET NULL
      `);
      console.log("✅ Column 'state_id' added to table 'projects'");
    } else {
      console.log("ℹ️ Column 'state_id' already exists in table 'projects'");
    }

    await client.query("COMMIT");
    console.log("🎉 Schema migration completed successfully.");

    // 4. Populate state_id for historical projects from Excel
    console.log(`📖 Reading Excel file from: ${EXCEL_PATH}`);
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`Found ${rows.length} rows in spreadsheet`);

    let updatedCount = 0;
    
    for (const row of rows) {
      const docNo = String(row["Doc. #"] || "").trim();
      const stateName = String(row["State"] || "").trim();
      
      if (!docNo || !stateName) continue;
      
      // Get or create state
      let stateRes = await client.query("SELECT state_id FROM states WHERE state_name = $1", [stateName]);
      let stateId;
      
      if (stateRes.rows.length > 0) {
        stateId = stateRes.rows[0].state_id;
      } else {
        const insertRes = await client.query(
          "INSERT INTO states (state_name) VALUES ($1) RETURNING state_id",
          [stateName]
        );
        stateId = insertRes.rows[0].state_id;
        console.log(`Created new state: "${stateName}" with ID ${stateId}`);
      }
      
      // Update projects table for the matching doc_no
      const updateRes = await client.query(
        "UPDATE projects SET state_id = $1 WHERE doc_no = $2 RETURNING project_id",
        [stateId, docNo]
      );
      
      if (updateRes.rows.length > 0) {
        updatedCount++;
      }
    }
    
    console.log(`✅ State migration completed: ${updatedCount} projects updated with state_id.`);
    process.exit(0);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runMigration();

const path = require("path");
require("dotenv").config();

const XLSX = require("xlsx");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const EXCEL_PATH = path.join(
  __dirname,
  "..",
  "Project Dashboard Dataset.xlsx"
);

console.log("Reading file from:");
console.log(EXCEL_PATH);

/*
-----------------------------------
DATE CONVERSION
22.03.2003 -> 2003-03-22
-----------------------------------
*/
function convertDate(dateValue) {
  if (!dateValue) return null;

  try {
    const value = String(dateValue).trim();

    // Excel serial date representation
    if (!isNaN(value) && value.indexOf('.') === -1 && value.indexOf('-') === -1) {
      const date = new Date(Math.round((Number(value) - 25569) * 86400 * 1000));
      return date.toISOString().split("T")[0];
    }

    const parts = value.split(".");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    const dashParts = value.split("-");
    if (dashParts.length === 3) {
      return value;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/*
-----------------------------------
AGENCY
-----------------------------------
*/
async function getOrCreateAgency(agencyName) {
  if (!agencyName) return null;
  const name = String(agencyName).trim();

  let result = await pool.query(
    "SELECT agency_id FROM agencies WHERE agency_name = $1",
    [name]
  );

  if (result.rows.length > 0) {
    return result.rows[0].agency_id;
  }

  result = await pool.query(
    "INSERT INTO agencies (agency_name, is_active) VALUES ($1, true) RETURNING agency_id",
    [name]
  );

  return result.rows[0].agency_id;
}

/*
-----------------------------------
FUNDING SOURCE
-----------------------------------
*/
async function getOrCreateFunding(sourceName) {
  if (!sourceName) return null;
  const name = String(sourceName).trim();

  let result = await pool.query(
    "SELECT funding_source_id FROM funding_sources WHERE source_name = $1",
    [name]
  );

  if (result.rows.length > 0) {
    return result.rows[0].funding_source_id;
  }

  result = await pool.query(
    "INSERT INTO funding_sources (source_name, is_active) VALUES ($1, true) RETURNING funding_source_id",
    [name]
  );

  return result.rows[0].funding_source_id;
}

/*
-----------------------------------
STATE
-----------------------------------
*/
async function getOrCreateState(stateName) {
  if (!stateName) return null;
  const name = String(stateName).trim();

  let result = await pool.query(
    "SELECT state_id FROM states WHERE state_name = $1",
    [name]
  );

  if (result.rows.length > 0) {
    return result.rows[0].state_id;
  }

  result = await pool.query(
    "INSERT INTO states (state_name, is_active) VALUES ($1, true) RETURNING state_id",
    [name]
  );

  return result.rows[0].state_id;
}

/*
-----------------------------------
STATUS
-----------------------------------
*/
async function getOrCreateStatus(statusName) {
  if (!statusName) return null;
  const name = String(statusName).trim();

  let result = await pool.query(
    "SELECT status_id FROM project_status WHERE status_name = $1",
    [name]
  );

  if (result.rows.length > 0) {
    return result.rows[0].status_id;
  }

  result = await pool.query(
    "INSERT INTO project_status (status_name) VALUES ($1) RETURNING status_id",
    [name]
  );

  return result.rows[0].status_id;
}

/*
-----------------------------------
THEME
-----------------------------------
*/
async function getOrCreateTheme(themeName) {
  if (!themeName) return null;
  const name = String(themeName).trim();

  let result = await pool.query(
    "SELECT theme_id FROM themes WHERE theme_name = $1",
    [name]
  );

  if (result.rows.length > 0) {
    return result.rows[0].theme_id;
  }

  result = await pool.query(
    "INSERT INTO themes (theme_name, is_active) VALUES ($1, true) RETURNING theme_id",
    [name]
  );

  return result.rows[0].theme_id;
}

/*
-----------------------------------
MAIN IMPORT
-----------------------------------
*/
async function importProjects() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting DB Schema migration for Sourse2, Theme1, Theme2...");
    await client.query("BEGIN");
    
    // Create new columns in projects table
    await client.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS funding_source2_id INTEGER REFERENCES funding_sources(funding_source_id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS theme1_id INTEGER REFERENCES themes(theme_id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS theme2_id INTEGER REFERENCES themes(theme_id) ON DELETE SET NULL
    `);
    
    console.log("✅ New columns created/verified in table 'projects'");
    await client.query("COMMIT");

    console.log("🗑️ Removing existing data from projects, agencies, and funding_sources...");
    await client.query("TRUNCATE TABLE projects, agencies, funding_sources CASCADE;");
    console.log("✅ Existing data cleared");

    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`Found ${rows.length} projects in spreadsheet`);

    for (const row of rows) {
      const docNo = String(row["Doc. #"] || "").trim();
      if (!docNo) continue;

      const agencyId = await getOrCreateAgency(row["Name of Agency"]);
      const fundingId = await getOrCreateFunding(row["Sourse"]);
      const fundingSource2Id = await getOrCreateFunding(row["Sourse2"]);
      const stateId = await getOrCreateState(row["State"]);
      const statusId = await getOrCreateStatus(row["Status"]);
      const theme1Id = await getOrCreateTheme(row["Theme1"]);
      const theme2Id = await getOrCreateTheme(row["Theme2"]);

      const approvalDate = convertDate(row["Date of Approval"]);
      
      // Sanctioned Amount can be parsed from the column, accounting for spacing
      const rawAmount = row[" Sanctioned Amount (Rs.) "] !== undefined ? row[" Sanctioned Amount (Rs.) "] : row["Sanctioned Amount (Rs.)"];
      const sanctionedAmount = rawAmount !== undefined && rawAmount !== null ? Number(rawAmount) : null;

      // Insert Project record
      const result = await pool.query(
        `
        INSERT INTO projects (
          doc_no,
          project_name,
          agency_id,
          year,
          approval_date,
          sanctioned_amount,
          status_id,
          funding_source_id,
          funding_source2_id,
          theme1_id,
          theme2_id,
          state_id,
          classification_status,
          classification_method
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        RETURNING project_id
        `,
        [
          docNo,
          row["Name of Project"] || "",
          agencyId,
          row["Year"] ? String(row["Year"]) : null,
          approvalDate,
          sanctionedAmount,
          statusId,
          fundingId,
          fundingSource2Id,
          theme1Id,
          theme2Id,
          stateId,
          "Completed",
          "Manual"
        ]
      );

      const projectId = result.rows[0].project_id;

      // Add Theme mappings into project_themes junction table
      if (theme1Id) {
        await pool.query(
          `INSERT INTO project_themes (project_id, theme_id, primary_flag)
           VALUES ($1, $2, true)
           ON CONFLICT DO NOTHING`,
          [projectId, theme1Id]
        );
      }

      if (theme2Id) {
        await pool.query(
          `INSERT INTO project_themes (project_id, theme_id, primary_flag)
           VALUES ($1, $2, false)
           ON CONFLICT DO NOTHING`,
          [projectId, theme2Id]
        );
      }

      console.log(`Imported Project ID: ${projectId} (Doc. #${docNo})`);
    }

    console.log("🎉 Import Completed Successfully");
    process.exit(0);

  } catch (error) {
    console.error("IMPORT ERROR:");
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
  }
}

importProjects();
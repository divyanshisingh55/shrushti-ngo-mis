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
  "Project Dashboard_15-06-2026.xlsx"
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

    const parts = value.split(".");

    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];

      return `${year}-${month}-${day}`;
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

  let result = await pool.query(
    `
    SELECT agency_id
    FROM agencies
    WHERE agency_name = $1
    `,
    [agencyName]
  );

  if (result.rows.length > 0) {
    return result.rows[0].agency_id;
  }

  result = await pool.query(
    `
    INSERT INTO agencies (agency_name)
    VALUES ($1)
    RETURNING agency_id
    `,
    [agencyName]
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

  let result = await pool.query(
    `
    SELECT funding_source_id
    FROM funding_sources
    WHERE source_name = $1
    `,
    [sourceName]
  );

  if (result.rows.length > 0) {
    return result.rows[0].funding_source_id;
  }

  result = await pool.query(
    `
    INSERT INTO funding_sources (source_name)
    VALUES ($1)
    RETURNING funding_source_id
    `,
    [sourceName]
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

  let result = await pool.query(
    `
    SELECT state_id
    FROM states
    WHERE state_name = $1
    `,
    [stateName]
  );

  if (result.rows.length > 0) {
    return result.rows[0].state_id;
  }

  result = await pool.query(
    `
    INSERT INTO states (state_name)
    VALUES ($1)
    RETURNING state_id
    `,
    [stateName]
  );

  return result.rows[0].state_id;
}

/*
-----------------------------------
STATUS
-----------------------------------
*/
async function getStatusId(statusName) {
  if (!statusName) return null;

  const result = await pool.query(
    `
    SELECT status_id
    FROM project_status
    WHERE status_name = $1
    `,
    [statusName]
  );

  return result.rows.length
    ? result.rows[0].status_id
    : null;
}

/*
-----------------------------------
MAIN IMPORT
-----------------------------------
*/
async function importProjects() {
  try {
    const workbook = XLSX.readFile(EXCEL_PATH);

    const sheetName = workbook.SheetNames[0];

    const rows = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName]
    );

    console.log(`Found ${rows.length} projects`);

    // DEBUG FIRST ROW
    console.log("FIRST ROW:");
    console.log(rows[0]);

    for (const row of rows) {

      const agencyId =
        await getOrCreateAgency(
          row["Name of Agency"]
        );

      const fundingId =
        await getOrCreateFunding(
          row["Sourse"]
        );

      const stateId =
        await getOrCreateState(
          row["State"]
        );

      const statusId =
        await getStatusId(
          row["Status"]
        );

      const approvalDate =
        convertDate(
          row["Date of Approval"]
        );

      console.log(
        "DATE:",
        row["Date of Approval"],
        "=>",
        approvalDate
      );

      const projectExists =
        await pool.query(
          `
          SELECT project_id
          FROM projects
          WHERE doc_no = $1
          `,
          [
            String(
              row["Doc. #"] || ""
            )
          ]
        );

      if (projectExists.rows.length > 0) {
        continue;
      }

      const result =
        await pool.query(
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
            classification_status
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9
          )
          RETURNING project_id
          `,
          [
            String(
              row["Doc. #"] || ""
            ),
            row["Name of Project"],
            agencyId,
            String(row["Year"]),
            approvalDate,
            row["Sanctioned Amount (Rs.)"],
            statusId,
            fundingId,
            "Pending"
          ]
        );

      console.log(
        `Imported Project ID: ${result.rows[0].project_id}`
      );
    }

    console.log(
      "🎉 Import Completed Successfully"
    );

    process.exit(0);

  } catch (error) {

    console.error(
      "IMPORT ERROR:"
    );

    console.error(error);

    process.exit(1);
  }
}

importProjects();
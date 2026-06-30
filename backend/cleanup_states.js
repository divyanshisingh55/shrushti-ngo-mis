require("dotenv").config();
const pool = require("./src/config/db");

const CANONICAL_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

async function cleanupStates() {
  const client = await pool.connect();
  try {
    // Show current states
    const current = await client.query("SELECT state_id, state_name FROM states ORDER BY state_name");
    console.log("\n=== CURRENT STATES IN DB ===");
    current.rows.forEach(r => console.log(`  [${r.state_id}] ${r.state_name}`));

    await client.query("BEGIN");

    // Step 1: Delete "Custom*" entries
    const deleteCustom = await client.query(`
      DELETE FROM states
      WHERE state_name ILIKE 'Custom%'
      RETURNING state_id, state_name
    `);
    console.log("\n=== DELETED CUSTOM STATES ===");
    if (deleteCustom.rows.length === 0) console.log("  (none)");
    deleteCustom.rows.forEach(r => console.log(`  Deleted [${r.state_id}] ${r.state_name}`));

    // Step 2: Get remaining states and identify non-canonical ones
    const remaining = await client.query("SELECT state_id, state_name FROM states ORDER BY state_name");
    const canonicalUpper = CANONICAL_STATES.map(s => s.toUpperCase());
    const badIds = remaining.rows
      .filter(r => !canonicalUpper.includes(r.state_name.trim().toUpperCase()))
      .map(r => r.state_id);

    if (badIds.length > 0) {
      console.log("\n=== NON-CANONICAL STATES TO DELETE ===");
      remaining.rows
        .filter(r => !canonicalUpper.includes(r.state_name.trim().toUpperCase()))
        .forEach(r => console.log(`  [${r.state_id}] ${r.state_name}`));

      // Null out project references to these bad states
      await client.query(
        `UPDATE projects SET state_id = NULL WHERE state_id = ANY($1::int[])`,
        [badIds]
      );

      // Try to clean junction table too
      try {
        await client.query(
          `DELETE FROM project_states WHERE state_id = ANY($1::int[])`,
          [badIds]
        );
      } catch(e) { /* table might not exist */ }

      const deletedBad = await client.query(
        `DELETE FROM states WHERE state_id = ANY($1::int[]) RETURNING state_id, state_name`,
        [badIds]
      );
      console.log("\n=== DELETED BAD STATES ===");
      deletedBad.rows.forEach(r => console.log(`  Deleted [${r.state_id}] ${r.state_name}`));
    } else {
      console.log("\n  No non-canonical states found.");
    }

    // Step 3: Insert missing canonical states
    const afterCleanup = await client.query("SELECT state_name FROM states");
    const existingNames = afterCleanup.rows.map(r => r.state_name.trim().toUpperCase());

    let inserted = 0;
    for (const state of CANONICAL_STATES) {
      if (!existingNames.includes(state.toUpperCase())) {
        await client.query("INSERT INTO states (state_name) VALUES ($1)", [state]);
        console.log(`  Inserted: ${state}`);
        inserted++;
      }
    }
    if (inserted === 0) console.log("\n  All canonical states already present.");

    await client.query("COMMIT");

    // Final state
    const final = await client.query("SELECT state_id, state_name FROM states ORDER BY state_name");
    console.log("\n=== FINAL STATES IN DB ===");
    final.rows.forEach(r => console.log(`  [${r.state_id}] ${r.state_name}`));
    console.log(`\nTotal: ${final.rows.length} states`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error:", err.message);
    console.error(err.stack);
  } finally {
    client.release();
    pool.end();
  }
}

cleanupStates();

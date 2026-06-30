const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET all finance records ordered by year
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM finance_records ORDER BY year ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single record by year
router.get("/:year", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM finance_records WHERE year = $1",
      [req.params.year]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new record
router.post("/", async (req, res) => {
  const {
    year, income, expenditure, surplus, turnover,
    total_assets, total_liabilities, networth,
    grant_received_total, grant_received_govt, grant_received_csr,
    grant_received_funding_agency, grant_received_fcra,
    grant_in_aid_total, grant_in_aid_govt, grant_in_aid_csr,
    grant_in_aid_funding_agency, grant_in_aid_fcra
  } = req.body;

  if (!year) return res.status(400).json({ message: "Year is required" });

  try {
    const result = await pool.query(`
      INSERT INTO finance_records (
        year, income, expenditure, surplus, turnover,
        total_assets, total_liabilities, networth,
        grant_received_total, grant_received_govt, grant_received_csr,
        grant_received_funding_agency, grant_received_fcra,
        grant_in_aid_total, grant_in_aid_govt, grant_in_aid_csr,
        grant_in_aid_funding_agency, grant_in_aid_fcra
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *
    `, [
      year,
      income || 0, expenditure || 0, surplus || 0, turnover || 0,
      total_assets || 0, total_liabilities || 0, networth || 0,
      grant_received_total || 0, grant_received_govt || 0, grant_received_csr || 0,
      grant_received_funding_agency || 0, grant_received_fcra || 0,
      grant_in_aid_total || 0, grant_in_aid_govt || 0, grant_in_aid_csr || 0,
      grant_in_aid_funding_agency || 0, grant_in_aid_fcra || 0
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: `A record for year ${year} already exists` });
    }
    res.status(500).json({ message: err.message });
  }
});

// PUT update existing record
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    year, income, expenditure, surplus, turnover,
    total_assets, total_liabilities, networth,
    grant_received_total, grant_received_govt, grant_received_csr,
    grant_received_funding_agency, grant_received_fcra,
    grant_in_aid_total, grant_in_aid_govt, grant_in_aid_csr,
    grant_in_aid_funding_agency, grant_in_aid_fcra
  } = req.body;

  try {
    const result = await pool.query(`
      UPDATE finance_records SET
        year = $1, income = $2, expenditure = $3, surplus = $4, turnover = $5,
        total_assets = $6, total_liabilities = $7, networth = $8,
        grant_received_total = $9, grant_received_govt = $10, grant_received_csr = $11,
        grant_received_funding_agency = $12, grant_received_fcra = $13,
        grant_in_aid_total = $14, grant_in_aid_govt = $15, grant_in_aid_csr = $16,
        grant_in_aid_funding_agency = $17, grant_in_aid_fcra = $18,
        updated_at = NOW()
      WHERE id = $19
      RETURNING *
    `, [
      year,
      income || 0, expenditure || 0, surplus || 0, turnover || 0,
      total_assets || 0, total_liabilities || 0, networth || 0,
      grant_received_total || 0, grant_received_govt || 0, grant_received_csr || 0,
      grant_received_funding_agency || 0, grant_received_fcra || 0,
      grant_in_aid_total || 0, grant_in_aid_govt || 0, grant_in_aid_csr || 0,
      grant_in_aid_funding_agency || 0, grant_in_aid_fcra || 0,
      id
    ]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a record
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM finance_records WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

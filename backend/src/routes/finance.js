const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const XLSX = require("xlsx");

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

// GET export to excel of filtered years
router.get("/export/excel", async (req, res) => {
  try {
    const { from_year, to_year, export_type } = req.query;
    let query = "SELECT * FROM finance_records";
    const params = [];

    if (from_year && to_year) {
      query += " WHERE year >= $1 AND year <= $2";
      params.push(from_year, to_year);
    } else if (from_year) {
      query += " WHERE year >= $1";
      params.push(from_year);
    } else if (to_year) {
      query += " WHERE year <= $1";
      params.push(to_year);
    }

    query += " ORDER BY year ASC";

    const result = await pool.query(query, params);
    
    // Map rows depending on export_type
    let mapped = [];
    let sheetName = "Financial Report";
    let filename = `finance_report_${from_year || 'all'}_to_${to_year || 'all'}`;

    if (export_type === 'income_vs_exp') {
      sheetName = "Income vs Expenditure";
      filename = `income_vs_expenditure_${from_year || 'all'}_to_${to_year || 'all'}`;
      mapped = result.rows.map(r => ({
        "Year": r.year,
        "Income": Number(r.income || 0),
        "Expenditure": Number(r.expenditure || 0),
        "Surplus": Number(r.surplus || 0)
      }));
    } else if (export_type === 'surplus') {
      sheetName = "Annual Surplus";
      filename = `surplus_deficit_${from_year || 'all'}_to_${to_year || 'all'}`;
      mapped = result.rows.map(r => ({
        "Year": r.year,
        "Surplus / Deficit": Number(r.surplus || 0)
      }));
    } else if (export_type === 'grants_cat') {
      sheetName = "Grants Categories";
      filename = `grants_by_category_${from_year || 'all'}_to_${to_year || 'all'}`;
      mapped = result.rows.map(r => ({
        "Year": r.year,
        "Grant Received (Total)": Number(r.grant_received_total || 0),
        "Grant in Aid (Total)": Number(r.grant_in_aid_total || 0)
      }));
    } else if (export_type === 'grants_source') {
      sheetName = "Grants Received Sources";
      filename = `grants_received_sources_${from_year || 'all'}_to_${to_year || 'all'}`;
      mapped = result.rows.map(r => ({
        "Year": r.year,
        "Government": Number(r.grant_received_govt || 0),
        "CSR": Number(r.grant_received_csr || 0),
        "Funding Agency": Number(r.grant_received_funding_agency || 0),
        "FCRA": Number(r.grant_received_fcra || 0),
        "Total": Number(r.grant_received_total || 0)
      }));
    } else if (export_type === 'gia_source') {
      sheetName = "Grant in Aid Sources";
      filename = `grant_in_aid_sources_${from_year || 'all'}_to_${to_year || 'all'}`;
      mapped = result.rows.map(r => ({
        "Year": r.year,
        "Government": Number(r.grant_in_aid_govt || 0),
        "CSR": Number(r.grant_in_aid_csr || 0),
        "Funding Agency": Number(r.grant_in_aid_funding_agency || 0),
        "FCRA": Number(r.grant_in_aid_fcra || 0),
        "Total": Number(r.grant_in_aid_total || 0)
      }));
    } else if (export_type === 'balance_sheet') {
      sheetName = "Balance Sheet";
      filename = `balance_sheet_${from_year || 'all'}_to_${to_year || 'all'}`;
      mapped = result.rows.map(r => ({
        "Year": r.year,
        "Total Assets": Number(r.total_assets || 0),
        "Total Liabilities": Number(r.total_liabilities || 0),
        "Networth": Number(r.networth || 0)
      }));
    } else if (export_type === 'turnover_trend') {
      sheetName = "Annual Turnover";
      filename = `turnover_trend_${from_year || 'all'}_to_${to_year || 'all'}`;
      mapped = result.rows.map(r => ({
        "Year": r.year,
        "Turnover": Number(r.turnover || 0)
      }));
    } else {
      // Default: full export
      mapped = result.rows.map(r => ({
        "Year": r.year,
        "Income": Number(r.income || 0),
        "Expenditure": Number(r.expenditure || 0),
        "Surplus": Number(r.surplus || 0),
        "Turnover": Number(r.turnover || 0),
        "Total Assets": Number(r.total_assets || 0),
        "Total Liabilities": Number(r.total_liabilities || 0),
        "Networth": Number(r.networth || 0),
        "Grant Received (Total)": Number(r.grant_received_total || 0),
        "Grant Received (Government)": Number(r.grant_received_govt || 0),
        "Grant Received (CSR)": Number(r.grant_received_csr || 0),
        "Grant Received (Funding Agency)": Number(r.grant_received_funding_agency || 0),
        "Grant Received (FCRA)": Number(r.grant_received_fcra || 0),
        "Grant in Aid (Total)": Number(r.grant_in_aid_total || 0),
        "Grant in Aid (Government)": Number(r.grant_in_aid_govt || 0),
        "Grant in Aid (CSR)": Number(r.grant_in_aid_csr || 0),
        "Grant in Aid (Funding Agency)": Number(r.grant_in_aid_funding_agency || 0),
        "Grant in Aid (FCRA)": Number(r.grant_in_aid_fcra || 0)
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(mapped);
    
    // Auto-size columns for neat display
    const cols = Object.keys(mapped[0] || {}).map(key => ({
      wch: Math.max(key.length + 2, 12)
    }));
    ws["!cols"] = cols;

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.xlsx`);
    res.send(buf);
  } catch (error) {
    console.error("Finance Excel Export Error:", error);
    res.status(500).json({ success: false, message: error.message });
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

const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sdgs WHERE is_active = true ORDER BY sdg_id");
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch SDGs Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

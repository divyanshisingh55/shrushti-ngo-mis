const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  const { state_id } = req.query;
  try {
    let result;
    if (state_id) {
      result = await pool.query(
        "SELECT * FROM districts WHERE state_id = $1 AND is_active = true ORDER BY district_name",
        [Number(state_id)]
      );
    } else {
      result = await pool.query("SELECT * FROM districts WHERE is_active = true ORDER BY district_name");
    }
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch Districts Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

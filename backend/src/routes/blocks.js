const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  const { district_id } = req.query;
  try {
    let result;
    if (district_id) {
      result = await pool.query(
        "SELECT * FROM blocks WHERE district_id = $1 AND is_active = true ORDER BY block_name",
        [Number(district_id)]
      );
    } else {
      result = await pool.query("SELECT * FROM blocks WHERE is_active = true ORDER BY block_name");
    }
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch Blocks Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

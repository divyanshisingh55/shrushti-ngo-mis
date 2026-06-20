const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM activity_types
      ORDER BY activity_type_name
    `);

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});

module.exports = router;
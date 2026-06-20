const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/:id", async (req, res) => {
  try {

    const result = await pool.query(
      "SELECT * FROM projects WHERE project_id = $1",
      [req.params.id]
    );

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;
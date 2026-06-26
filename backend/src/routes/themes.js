const express = require("express");
const router = express.Router();

const pool = require("../config/db");

/*
GET ALL THEMES
*/
router.get("/", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM themes
      WHERE theme_id IN (1, 2, 3, 4, 5, 6, 7, 8)
      ORDER BY theme_name
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

/*
ADD THEME
*/
router.post("/", async (req, res) => {

  try {

    const { theme_name, description } = req.body;

    const result = await pool.query(
      `
      INSERT INTO themes
      (theme_name, description)
      VALUES
      ($1,$2)
      RETURNING *
      `,
      [theme_name, description]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

module.exports = router;
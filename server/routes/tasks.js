const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, completed, created_at FROM tasks ORDER BY created_at DESC, id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/tasks failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

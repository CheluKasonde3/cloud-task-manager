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

router.post("/", async (req, res) => {
  const { title, description } = req.body || {};

  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Title is required" });
  }
  if (description !== undefined && description !== null && typeof description !== "string") {
    return res.status(400).json({ error: "Description must be a string" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING id, title, description, completed, created_at",
      [title.trim(), description ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/tasks failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

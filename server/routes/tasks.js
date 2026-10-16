const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

// Returns a positive integer that fits a Postgres INTEGER, or null.
function parseId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id >= 1 && id <= 2147483647 ? id : null;
}

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

router.patch("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  const { completed } = req.body || {};
  if (typeof completed !== "boolean") {
    return res.status(400).json({ error: "completed must be true or false" });
  }

  try {
    const result = await pool.query(
      "UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING id, title, description, completed, created_at",
      [completed, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/tasks/:id failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /api/tasks/:id failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;


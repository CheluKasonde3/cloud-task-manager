const express = require("express");
const cors = require("cors");
const tasksRouter = require("./routes/tasks");

const app = express();

// If FRONTEND_ORIGIN is missing, block cross-origin requests
// instead of letting cors fall back to "allow everyone".
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || false }));
app.use(express.json());

app.get("/", (req, res) => res.send("Task Manager API is running"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/tasks", tasksRouter);

// Error handler: must come after all routes and take four arguments.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }

  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;

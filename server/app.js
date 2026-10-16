const express = require("express");
const cors = require("cors");

const app = express();

// If FRONTEND_ORIGIN is missing, block cross-origin requests
// instead of letting cors fall back to "allow everyone".
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || false }));
app.use(express.json());

app.get("/", (req, res) => res.send("Task Manager API is running"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

module.exports = app;

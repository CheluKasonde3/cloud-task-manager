const express = require("express");
const app = express();

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/", (req, res) => res.send("Task Manager API is running"));
app.listen(process.env.PORT || 3000);

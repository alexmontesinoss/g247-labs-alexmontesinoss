/*
  Starter — src/app.js
  Session 18 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 6 · Session 18 · Practice (AF2) · Pair work

  Paste this file into src/app.js. It evolves the Session 15 app with the
  router and centralized error-handler patterns introduced in Sessions 16
  and 17, now applied to the full CRUD API.

  Still EXPORTS the app and still does NOT call app.listen — server.js does
  that, which is exactly what lets the Jest + supertest tests import this
  app in-process without opening a port. Do NOT change the export.

  Carry over src/middleware/logger.js from your Session 15 project
  unchanged — it is required just below.
*/

const express = require("express");
const logger = require("./middleware/logger"); // carried over from Session 15
const tasksRouter = require("./routes/tasks");

const app = express();

app.use(express.json()); // parse JSON bodies into req.body
app.use(logger);         // one log line per request

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Monta el router de tareas: todo lo que empiece por /tasks va alli.
// Va DESPUES de los middleware y ANTES del error handler de abajo.
app.use("/tasks", tasksRouter);

// error-handling middleware — still registered LAST, after every route.
app.use((err, req, res, next) => {
  console.error(err.message);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

module.exports = app;

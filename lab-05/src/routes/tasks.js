/*
  Starter — src/routes/tasks.js
  Session 18 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 6 · Session 18 · Practice (AF2) · Pair work

  Paste this file into src/routes/tasks.js. It applies the thin-router pattern
  introduced in Sessions 16 and 17 to the five CRUD routes.

  Keep this file THIN — it only maps HTTP verb + path to a controller
  function; all the logic lives in the controller. Do NOT change the export.

  This router is mounted at "/tasks" in app.js, so "/" means "/tasks" and
  "/:id" means "/tasks/:id".
*/

const express = require("express");
const {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/tasksController");

const router = express.Router();

// El router se monta en "/tasks", asi que "/" ya significa "/tasks".
// Aqui no hay logica: cada linea solo empareja verbo + ruta con su funcion.
router.get("/", listTasks);        // listar todas
router.get("/:id", getTask);       // leer una
router.post("/", createTask);      // crear
router.put("/:id", updateTask);    // sustituir entera
router.delete("/:id", deleteTask); // borrar

module.exports = router;

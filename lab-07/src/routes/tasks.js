/*
  Starter — src/routes/tasks.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2) · Pair work

  Paste this file into src/routes/tasks.js. This GROWS the Session 18 router:
  the five CRUD routes are now PROTECTED and the write routes run through the
  Zod validator.

  This router is mounted BEHIND the auth middleware in app.js:
      app.use("/tasks", auth, buildTasksRouter(tasksController));
  so req.user is already set on every handler below (auth ran first).

  Do NOT rename buildTasksRouter. Keep it thin.
*/

const express = require("express");
const { taskSchema, validate } = require("../validators/taskSchema");

function buildTasksRouter(tasksController) {
  const router = express.Router();

  // TODO: GET    "/"    -> tasksController.list    (paginated, owner-scoped)
  // TODO: GET    "/:id" -> tasksController.getOne  (404 / 403 / 200)
  // TODO: POST   "/"    -> validate(taskSchema), tasksController.create
  // TODO: PUT    "/:id" -> validate(taskSchema), tasksController.update
  // TODO: DELETE "/:id" -> tasksController.remove

  return router;
}

module.exports = { buildTasksRouter };

/*
  src/routes/tasks.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS

  This GROWS the Session 18 router: the five CRUD routes are now PROTECTED
  and the write routes run through the Zod validator.

  This router is mounted BEHIND the auth middleware in app.js:
      app.use("/tasks", auth, buildTasksRouter(tasksController));
  so req.user is already set on every handler below (auth ran first).

  Do NOT rename buildTasksRouter. Keep it thin.
*/

const express = require("express");
const { taskSchema, validate } = require("../validators/taskSchema");

// El router sigue sin tener logica: solo dice que URL va a que funcion, y por
// que filtros pasa antes de llegar.
function buildTasksRouter(tasksController) {
  const router = express.Router();

  router.get("/", tasksController.list);
  router.get("/:id", tasksController.getOne);

  // Las dos que traen cuerpo pasan primero por el validador. Si el cuerpo no
  // cuadra, el validador contesta 400 y el controlador ni se entera.
  router.post("/", validate(taskSchema), tasksController.create);
  router.put("/:id", validate(taskSchema), tasksController.update);

  router.delete("/:id", tasksController.remove);

  return router;
}

module.exports = { buildTasksRouter };

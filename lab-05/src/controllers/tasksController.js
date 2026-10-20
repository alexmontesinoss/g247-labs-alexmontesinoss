/*
  Starter — src/controllers/tasksController.js
  Session 18 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 6 · Session 18 · Practice (AF2) · Pair work

  This file applies the controller pattern introduced in Sessions 16 and 17
  to the Session 15 Tasks API. Paste it into
  src/controllers/tasksController.js and complete the five operations.

  Do NOT rename the exports (listTasks, getTask, createTask, updateTask,
  deleteTask) and do NOT change their (req, res, next) signatures — the
  router and the Jest tests import them by name.

  The in-memory store now lives HERE and is MUTABLE. Lab 6 (Session 22)
  will replace this array with a node-postgres model WITHOUT changing these
  exported function names — that stable public API is the whole point of
  keeping data out of the route file. Task shape stays { id, title, done,
  userId } to match the users + tasks database schema.
*/

// Mutable in-memory store — pretend it is a database table.
let tasks = [
  { id: 1, title: "Write the API skeleton", done: true, userId: 1 },
  { id: 2, title: "Add full CRUD", done: false, userId: 1 },
  { id: 3, title: "Return the right status codes", done: false, userId: 2 },
];
let nextId = 4; // the id the next created task will get

// Devuelve true si el titulo no sirve: no viene, no es texto o esta vacio.
function tituloInvalido(title) {
  return typeof title !== "string" || title.trim() === "";
}

// GET /tasks
function listTasks(req, res, next) {
  // 200 OK con la coleccion entera
  res.status(200).json(tasks);
}

// GET /tasks/:id
function getTask(req, res, next) {
  // req.params.id llega como texto: Number() lo pasa a numero para comparar
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    // 404 Not Found: la ruta existe, el recurso no
    return res.status(404).json({ error: "Task not found" });
  }

  res.status(200).json(task);
}

// POST /tasks  (create)
function createTask(req, res, next) {
  const { title, done, userId } = req.body || {};

  // Validar SIEMPRE antes de tocar el array: si falla, no se crea nada
  if (tituloInvalido(title)) {
    return res.status(400).json({ error: "title is required" });
  }

  const task = {
    id: nextId++,                                // usa el id y lo incrementa
    title: title,
    done: done === undefined ? false : done,     // por defecto, sin hacer
    userId: userId === undefined ? null : userId,
  };

  tasks.push(task);

  // 201 Created + la cabecera Location, que dice donde ha quedado el recurso
  res.status(201).location(`/tasks/${task.id}`).json(task);
}

// PUT /tasks/:id  (full replace)
function updateTask(req, res, next) {
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  // Primero el 404: si no existe, da igual lo que mande el cliente
  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const { title, done, userId } = req.body || {};

  if (tituloInvalido(title)) {
    return res.status(400).json({ error: "title is required" });
  }

  // PUT SUSTITUYE el recurso entero: se construye una tarea nueva de cero,
  // conservando solo el id. Lo que el cliente no mande vuelve a su valor
  // por defecto, no se conserva lo que hubiera antes.
  const replaced = {
    id: id,
    title: title,
    done: done === undefined ? false : done,
    userId: userId === undefined ? null : userId,
  };

  tasks[index] = replaced;

  res.status(200).json(replaced);
}

// DELETE /tasks/:id
function deleteTask(req, res, next) {
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  // splice quita 1 elemento a partir de esa posicion
  tasks.splice(index, 1);

  // 204 No Content: ha ido bien y no hay nada que devolver.
  // .end() cierra la respuesta sin cuerpo; un .json() aqui estaria mal.
  res.status(204).end();
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };

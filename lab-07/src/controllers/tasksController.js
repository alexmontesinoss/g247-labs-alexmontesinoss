/*
  Starter — src/controllers/tasksController.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2) · Pair work

  Paste this file into src/controllers/tasksController.js. This GROWS the
  Session 18 controller: it is backed by Session 22's tasksModel (async DB
  calls, not an array), every handler is owner-checked, and the list route is
  paginated.

  Factory takes the tasksModel so it is easy to test. Do NOT rename
  createTasksController or any of the five handlers.

  NOTE — evolution from Sessions 15/18: we move from free-standing named exports
  to this dependency-injection FACTORY so the model (a fake in tests) can be
  injected and each handler unit-tested. Name map: listTasks -> list,
  getTask -> getOne, createTask -> create, updateTask -> update, deleteTask -> remove.

  toDTO keeps the public API contract identical to Session 18: the database
  row is snake_case (user_id), but responses stay camelCase (userId).
*/

function createTasksController({ tasksModel }) {
  // Map a DB row -> the API contract. Keeps the response shape stable even
  // though the column is user_id.
  const toDTO = (row) => ({
    id: row.id,
    title: row.title,
    done: row.done,
    userId: row.user_id,
  });

  return {
    // GET /tasks?page=&limit=  — only the caller's own tasks, paginated.
    async list(req, res, next) {
      // TODO: normalize the query params to safe integers:
      //   page  = positive integer, cap at 100000, default 1
      //   limit = integer clamped to 1..100, default 20
      //   reject/normalize fractions, Infinity and non-numeric values
      //   offset = (page - 1) * limit
      // TODO: rows = await tasksModel.findByOwner(req.user.sub, { limit, offset })
      // TODO: res.json({ page, limit, items: rows.map(toDTO) })
      // try/catch -> next(err)
    },

    // GET /tasks/:id  — 404 if missing, 403 if not the caller's, else 200.
    async getOne(req, res, next) {
      // TODO: task = await tasksModel.findById(Number(req.params.id))
      // TODO: if (!task) -> 404
      // TODO: if (Number(task.user_id) !== Number(req.user.sub)) -> 403
      // TODO: else res.json(toDTO(task))
      // try/catch -> next(err)
    },

    // POST /tasks  — body already validated by the Zod middleware.
    async create(req, res, next) {
      // TODO: const { title, done } = req.body
      // TODO: created = await tasksModel.create({ title, userId: req.user.sub, done })
      //   (owner comes from the token, NEVER from the body)
      // TODO: res.status(201).location(`/tasks/${created.id}`).json(toDTO(created))
      // try/catch -> next(err)
    },

    // PUT /tasks/:id  — owner-checked full replace; body already validated.
    async update(req, res, next) {
      // TODO: load the task; 404 if missing; 403 if not owner.
      // TODO: updated = await tasksModel.update(id, { title, done }); 200 + toDTO.
      // try/catch -> next(err)
    },

    // DELETE /tasks/:id  — owner-checked.
    async remove(req, res, next) {
      // TODO: load the task; 404 if missing; 403 if not owner.
      // TODO: await tasksModel.remove(id); respond 204 with no body.
      // try/catch -> next(err)
    },
  };
}

module.exports = { createTasksController };

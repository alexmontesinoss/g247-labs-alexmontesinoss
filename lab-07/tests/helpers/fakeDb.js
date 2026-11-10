/*
  tests/helpers/fakeDb.js

  Base de datos falsa en memoria. Entiende las mismas consultas que mandan
  usersModel y tasksModel, y devuelve lo mismo que devolveria node-postgres:
  un objeto con rows y rowCount.

  Es infraestructura de pruebas, no codigo de la aplicacion. Existe para que
  todo el laboratorio se pueda probar sin tener PostgreSQL instalado: el
  modelo recibe la base de datos como parametro, asi que le da igual quien se
  la pase.
*/

function createFakeDb() {
  const users = [];
  const tasks = [];
  let nextUser = 1;
  let nextTask = 1;
  const calls = [];

  return {
    users,
    tasks,
    calls,

    async query(text, params = []) {
      calls.push({ text, params: [...params] });
      const sql = text.replace(/\s+/g, " ").trim();

      // ---- usuarios ----
      if (sql.startsWith("SELECT id, email, password_hash")) {
        const u = users.find((x) => x.email === params[0]);
        return { rows: u ? [{ ...u }] : [], rowCount: u ? 1 : 0 };
      }

      if (sql.startsWith("INSERT INTO users")) {
        const u = {
          id: nextUser++,
          email: params[0],
          password_hash: params[1],
          role: params[2],
        };
        users.push(u);
        // Igual que el modelo: el hash NO sale
        return { rows: [{ id: u.id, email: u.email, role: u.role }], rowCount: 1 };
      }

      // ---- tareas ----
      if (sql.startsWith("INSERT INTO tasks")) {
        const t = { id: nextTask++, user_id: params[0], title: params[1], done: params[2] };
        tasks.push(t);
        return { rows: [{ ...t }], rowCount: 1 };
      }

      if (sql.startsWith("UPDATE tasks")) {
        const [id, title, done, userId] = params;
        const t = tasks.find((x) => x.id === id);
        if (!t) return { rows: [], rowCount: 0 };
        if (title !== null) t.title = title;
        if (done !== null) t.done = done;
        if (userId !== null) t.user_id = userId;
        return { rows: [{ ...t }], rowCount: 1 };
      }

      if (sql.startsWith("DELETE FROM tasks")) {
        const i = tasks.findIndex((x) => x.id === params[0]);
        if (i === -1) return { rows: [], rowCount: 0 };
        tasks.splice(i, 1);
        return { rows: [{ id: params[0] }], rowCount: 1 };
      }

      if (sql.includes("WHERE user_id = $1")) {
        const [userId, limit, offset] = params;
        const rows = tasks
          .filter((x) => x.user_id === userId)
          .sort((a, b) => a.id - b.id)
          .slice(offset, offset + limit)
          .map((x) => ({ ...x }));
        return { rows, rowCount: rows.length };
      }

      if (sql.includes("WHERE id = $1")) {
        const t = tasks.find((x) => x.id === params[0]);
        return { rows: t ? [{ ...t }] : [], rowCount: t ? 1 : 0 };
      }

      if (sql.startsWith("SELECT") && sql.includes("FROM tasks")) {
        const rows = tasks.sort((a, b) => a.id - b.id).map((x) => ({ ...x }));
        return { rows, rowCount: rows.length };
      }

      throw new Error("FakeDb: SQL no reconocido -> " + sql);
    },
  };
}

module.exports = { createFakeDb };

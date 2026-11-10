/*
  src/models/usersModel.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2)

  Sits alongside Session 22's tasksModel and uses the SAME injectable-db
  pattern: a factory that takes a `db` with an async query(text, params).

  Do NOT rename `createUsersModel`, `findByEmail`, or `create`, and keep
  every query PARAMETERIZED ($1, $2, ...). Never string-concatenate input.
*/

function createUsersModel(db) {
  return {
    // Se usa al entrar. Devuelve la fila ENTERA, con el password_hash dentro,
    // porque el controlador lo necesita para comparar la contrasena. Si el
    // correo no esta registrado devuelve null.
    async findByEmail(email) {
      const sql = `
        SELECT id, email, password_hash, role
        FROM users
        WHERE email = $1
      `;
      const { rows } = await db.query(sql, [email]);
      return rows[0] ?? null;
    },

    // Se usa al registrarse. Recibe la contrasena YA cifrada: el cifrado lo
    // hace el controlador antes de llamar aqui.
    //
    // Fijate en lo que NO pone el RETURNING: password_hash. El hash no sale
    // nunca del modelo, asi que es imposible que se cuele por error en una
    // respuesta de la API.
    async create({ email, passwordHash, role = "user" }) {
      const sql = `
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, email, role
      `;
      const { rows } = await db.query(sql, [email, passwordHash, role]);
      return rows[0];
    },
  };
}

module.exports = { createUsersModel };

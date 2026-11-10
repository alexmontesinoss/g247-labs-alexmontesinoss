/*
  Starter — src/models/usersModel.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2) · Pair work

  Paste this file into src/models/usersModel.js. It sits alongside Session
  22's tasksModel and uses the SAME injectable-db pattern: a factory that
  takes a `db` with an async query(text, params) method (a node-postgres
  Pool in production, an in-memory fake in tests).

  The users table gains two columns for auth (see the brief §3.1):
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user'

  Do NOT rename `createUsersModel`, `findByEmail`, or `create`, and keep
  every query PARAMETERIZED ($1, $2, ...). Never string-concatenate input.
*/

function createUsersModel(db) {
  return {
    // Used at login. Returns the FULL row (including password_hash) so the
    // controller can bcrypt.compare — or null if the email is unknown.
    async findByEmail(email) {
      // TODO: SELECT id, email, password_hash, role FROM users WHERE email = $1
      //   params: [email]  -> return rows[0] ?? null
    },

    // Used at sign-up. Stores the ALREADY-HASHED password (the controller
    // hashes it with bcrypt before calling this). RETURNING must NOT include
    // password_hash — never let a hash leave the model.
    async create({ email, passwordHash, role = "user" }) {
      // TODO: INSERT INTO users (email, password_hash, role)
      //         VALUES ($1, $2, $3)
      //         RETURNING id, email, role
      //   params: [email, passwordHash, role]  -> return the created row.
    },
  };
}

module.exports = { createUsersModel };

/*
  src/models/usersModel.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Factoria: recibe la base de datos y devuelve el modelo. Lo unico que le
  exige a "db" es que sepa hacer query(texto, parametros), asi que le da
  igual si es un Pool de verdad o una falsa de las pruebas.

  Todas las consultas van parametrizadas con $1, $2... Nunca se pega texto
  del usuario dentro del SQL.
*/

function createUsersModel(db) {
  return {
    // Para el login. Devuelve la fila ENTERA, con el hash, porque el
    // controlador lo necesita para comparar la contrasena.
    async findByEmail(email) {
      const { rows } = await db.query(
        `SELECT id, email, password_hash, role, created_at
         FROM users
         WHERE email = $1`,
        [email]
      );
      return rows[0] ?? null;
    },

    // Para el middleware de autenticacion y para comprobar duenos. Aqui NO
    // se devuelve el hash: quien pregunta "quien es el usuario 3" no tiene
    // ninguna necesidad de ver su contrasena cifrada.
    async findById(id) {
      const { rows } = await db.query(
        `SELECT id, email, role, created_at
         FROM users
         WHERE id = $1`,
        [id]
      );
      return rows[0] ?? null;
    },

    // Para el registro. Recibe la contrasena YA cifrada: cifrarla es cosa
    // del controlador, no del modelo.
    // El RETURNING no incluye password_hash: el hash no sale nunca de aqui,
    // asi es imposible que se cuele por error en una respuesta.
    async create({ email, passwordHash, role = "user" }) {
      const { rows } = await db.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, email, role, created_at`,
        [email, passwordHash, role]
      );
      return rows[0];
    },
  };
}

module.exports = { createUsersModel };

/*
  src/models/tasksModel.js
  Session 22 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 22 · Practice (AF2)

  This is the models/ SEAM. In Lab 5 the tasks lived in an array inside the
  controller; now a real database takes its place.

  Do NOT rename these methods and do NOT change their signatures — the
  controller and the tests depend on them.

  GOLDEN RULE: every query is PARAMETERIZED ($1, $2, ...). NEVER build SQL by
  concatenating user input — that is how SQL injection happens.
*/

// Esto es una FACTORIA: no exporto el modelo ya hecho, sino una funcion que
// fabrica uno con la base de datos que yo le pase. A eso se le llama inyectar
// la dependencia. En la aplicacion de verdad le paso un Pool de node-postgres;
// en las pruebas le paso una base de datos falsa en memoria. El modelo es el
// mismo en los dos casos: lo unico que le pido a "db" es que sepa hacer
// query(texto, parametros).
function createTasksModel(db) {
  return {
    // Todas las tareas.
    // El ORDER BY no es un capricho: sin el, la base de datos no promete
    // ningun orden concreto, y el resultado podria salir distinto cada vez.
    async findAll() {
      const sql = `
        SELECT id, user_id, title, done
        FROM tasks
        ORDER BY id
      `;
      const { rows } = await db.query(sql, []);
      return rows;
    },

    // Una tarea por su id, o null si no existe.
    // Devuelvo null y no undefined porque el controlador necesita distinguir
    // "no hay tarea" para contestar un 404.
    async findById(id) {
      const sql = `
        SELECT id, user_id, title, done
        FROM tasks
        WHERE id = $1
      `;
      const { rows } = await db.query(sql, [id]);
      return rows[0] ?? null;
    },

    // Crear una tarea.
    // done vale false si no me lo mandan, igual que el DEFAULT FALSE del
    // schema.sql.
    // RETURNING hace que el INSERT me devuelva la fila tal y como ha quedado
    // guardada, con el id que le ha puesto la base de datos. Sin RETURNING
    // tendria que hacer un SELECT despues para enterarme del id.
    async create({ title, userId, done = false }) {
      const sql = `
        INSERT INTO tasks (user_id, title, done)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, title, done
      `;
      const { rows } = await db.query(sql, [userId, title, done]);
      return rows[0];
    },

    // Modificar una tarea. Devuelve la fila ya cambiada, o null si ese id no
    // existe.
    //
    // COALESCE(a, b) se queda con el primer valor que NO sea NULL. Asi, si no
    // mando un campo viaja como NULL y la columna se queda como estaba; y si
    // lo mando, se cambia. Es el equivalente en SQL de lo que hacia PATCH en
    // la practica 1.
    //
    // Ojo con esta linea: uso ?? y no ||. "??" solo salta cuando el valor es
    // null o undefined, mientras que "||" saltaria tambien con false. Como
    // done es un booleano, con || seria imposible marcar una tarea como NO
    // hecha: el false se colaria como si no hubiera mandado nada.
    async update(id, fields) {
      const sql = `
        UPDATE tasks
        SET title   = COALESCE($2, title),
            done    = COALESCE($3, done),
            user_id = COALESCE($4, user_id)
        WHERE id = $1
        RETURNING id, user_id, title, done
      `;
      const params = [
        id,
        fields.title ?? null,
        fields.done ?? null,
        fields.userId ?? null,
      ];
      const { rows } = await db.query(sql, params);
      return rows[0] ?? null;
    },

    // Borrar una tarea. Devuelve true si habia algo que borrar y false si no.
    // El controlador usa ese booleano para contestar 204 o 404.
    // rowCount es el numero de filas que ha tocado la sentencia.
    async remove(id) {
      const sql = `
        DELETE FROM tasks
        WHERE id = $1
        RETURNING id
      `;
      const result = await db.query(sql, [id]);
      return result.rowCount > 0;
    },

    // Las tareas de un usuario concreto, paginadas.
    // Esta es la que usara el laboratorio 7 para el listado protegido.
    // limit y offset tienen valores por defecto, y el "= {}" del final es para
    // que se pueda llamar findByOwner(1) sin pasar el segundo argumento.
    async findByOwner(userId, { limit = 10, offset = 0 } = {}) {
      const sql = `
        SELECT id, user_id, title, done
        FROM tasks
        WHERE user_id = $1
        ORDER BY id
        LIMIT $2 OFFSET $3
      `;
      const { rows } = await db.query(sql, [userId, limit, offset]);
      return rows;
    },
  };
}

module.exports = { createTasksModel };

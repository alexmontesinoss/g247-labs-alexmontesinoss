/*
  src/controllers/tasksController.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2)

  This GROWS the Session 18 controller: it is backed by Session 22's
  tasksModel (async DB calls, not an array), every handler is owner-checked,
  and the list route is paginated.

  Factory takes the tasksModel so it is easy to test. Do NOT rename
  createTasksController or any of the five handlers.

  toDTO keeps the public API contract identical to Session 18: the database
  row is snake_case (user_id), but responses stay camelCase (userId).
*/

// Topes de la paginacion. El de limit es de seguridad: sin el, alguien podria
// pedir limit=1000000 y obligar al servidor a traerse la tabla entera.
const PAGE_POR_DEFECTO = 1;
const PAGE_MAXIMA = 100000;
const LIMIT_POR_DEFECTO = 20;
const LIMIT_MINIMO = 1;
const LIMIT_MAXIMO = 100;

/*
  Convierte un parametro de la URL en un entero dentro de unos limites.

  Tres casos, y cada uno se trata distinto a proposito:
    - no viene, o no es un entero ("abc", "2.5", "Infinity") -> el valor por
      defecto, porque no se que me estaban pidiendo.
    - viene pero se sale del rango (page=0, limit=999) -> se recorta al borde
      mas cercano, porque si se entiende lo que pedian.
    - viene bien -> se usa tal cual.

  Si un parametro llega repetido, Express lo entrega como array; me quedo con
  el primer valor en vez de dejar que el Number de un array reviente.
*/
function aEntero(valor, porDefecto, minimo, maximo) {
  const texto = Array.isArray(valor) ? valor[0] : valor;

  if (texto === undefined || texto === null || texto === "") {
    return porDefecto;
  }

  const numero = Number(texto);

  // Number.isInteger descarta de una vez los textos que no son numeros, los
  // decimales y los infinitos: ninguno de los tres es un entero.
  if (!Number.isInteger(numero)) {
    return porDefecto;
  }

  if (numero < minimo) return minimo;
  if (numero > maximo) return maximo;
  return numero;
}

function createTasksController({ tasksModel }) {
  // La fila de la base de datos viene en snake_case (user_id) porque asi se
  // llama la columna. La API habla en camelCase (userId). Esta funcion traduce
  // de una a la otra, y asi el contrato publico no cambia aunque cambien los
  // nombres de las columnas.
  const toDTO = (row) => ({
    id: row.id,
    title: row.title,
    done: row.done,
    userId: row.user_id,
  });

  return {
    // GET /tasks?page=&limit=  — solo las tareas de quien llama, paginadas.
    async list(req, res, next) {
      try {
        const page = aEntero(req.query.page, PAGE_POR_DEFECTO, 1, PAGE_MAXIMA);
        const limit = aEntero(req.query.limit, LIMIT_POR_DEFECTO, LIMIT_MINIMO, LIMIT_MAXIMO);

        // La pagina 1 empieza en la fila 0, la 2 en la 20, la 3 en la 40...
        const offset = (page - 1) * limit;

        // req.user.sub viene del token ya verificado. Por eso es imposible
        // pedir las tareas de otro: el filtro no sale de la URL.
        const filas = await tasksModel.findByOwner(req.user.sub, { limit, offset });

        res.json({ page, limit, items: filas.map(toDTO) });
      } catch (err) {
        next(err);
      }
    },

    // GET /tasks/:id — 404 si no existe, 403 si no es tuya, 200 si lo es.
    async getOne(req, res, next) {
      try {
        const tarea = await tasksModel.findById(Number(req.params.id));

        if (!tarea) {
          return res.status(404).json({ error: "Task not found" });
        }
        if (Number(tarea.user_id) !== Number(req.user.sub)) {
          return res.status(403).json({ error: "Forbidden" });
        }

        res.json(toDTO(tarea));
      } catch (err) {
        next(err);
      }
    },

    // POST /tasks — el cuerpo ya viene validado por el middleware de Zod.
    async create(req, res, next) {
      try {
        const { title, done } = req.body;

        // El dueno sale del TOKEN, nunca del cuerpo. Si lo cogiera del cuerpo,
        // cualquiera podria crear tareas a nombre de otro.
        const creada = await tasksModel.create({
          title,
          userId: req.user.sub,
          done,
        });

        res.status(201).location(`/tasks/${creada.id}`).json(toDTO(creada));
      } catch (err) {
        next(err);
      }
    },

    // PUT /tasks/:id — sustitucion entera, comprobando que la tarea es tuya.
    async update(req, res, next) {
      try {
        const id = Number(req.params.id);
        const tarea = await tasksModel.findById(id);

        // El 404 va ANTES que el 403: si la tarea no existe no hay dueno que
        // comparar. Y ademas, contestar 403 de algo que no existe le estaria
        // diciendo al que pregunta que ese id si existe pero es de otro.
        if (!tarea) {
          return res.status(404).json({ error: "Task not found" });
        }
        if (Number(tarea.user_id) !== Number(req.user.sub)) {
          return res.status(403).json({ error: "Forbidden" });
        }

        const { title, done } = req.body;
        const actualizada = await tasksModel.update(id, { title, done });

        res.json(toDTO(actualizada));
      } catch (err) {
        next(err);
      }
    },

    // DELETE /tasks/:id — tambien comprobando que es tuya.
    async remove(req, res, next) {
      try {
        const id = Number(req.params.id);
        const tarea = await tasksModel.findById(id);

        if (!tarea) {
          return res.status(404).json({ error: "Task not found" });
        }
        if (Number(tarea.user_id) !== Number(req.user.sub)) {
          return res.status(403).json({ error: "Forbidden" });
        }

        await tasksModel.remove(id);

        // 204: ha ido bien y no hay cuerpo. send() sin argumentos cierra la
        // respuesta sin escribir nada.
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  };
}

module.exports = { createTasksController };

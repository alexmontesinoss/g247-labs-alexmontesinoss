/*
  src/controllers/partidosController.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  El controlador traduce entre HTTP y el modelo. No lleva SQL (eso esta en
  src/models/) y no lleva reglas de formato (eso esta en src/validators/).
  Lo suyo es: leer la peticion, pedirle al modelo, y elegir el codigo de
  estado correcto.

  Todos los metodos son async porque ahora hablan con una base de datos, y
  todos llevan try/catch con next(err): si una promesa se rompe y nadie la
  recoge, la peticion se queda colgada para siempre y el cliente se come el
  tiempo de espera sin saber por que.
*/

const { toDTO } = require("../mappers/partidoMapper");
const { puedeTocar } = require("../middleware/auth");

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100; // sin tope, un ?limit=999999 se trae la tabla entera
const PAGINA_MAXIMA = 100000;

/*
  En la URL TODO es texto, asi que page y limit hay que convertirlos a mano.

  Number("") da 0 y Number("hola") da NaN, asi que no vale con convertir y
  ya. Y ojo con la notacion cientifica: Number("1e3") da 1000, asi que
  comprobar que son solo digitos ANTES de convertir evita sorpresas.
*/
function aEntero(valor, porDefecto) {
  if (typeof valor !== "string" || !/^[0-9]+$/.test(valor)) return porDefecto;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : porDefecto;
}

function entreLimites(numero, minimo, maximo) {
  return Math.min(Math.max(numero, minimo), maximo);
}

/*
  El id de la ruta. Mismo cuidado: /partidos/1e1 NO puede acabar buscando el
  partido 10, y /partidos/abc tiene que dar 404 y no reventar la consulta.
  Devuelve null cuando no es un id valido.
*/
function idDeRuta(valor) {
  if (!/^[0-9]+$/.test(String(valor))) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

// Los parametros de busqueda que se aceptan por la URL, en un solo sitio.
function filtrosDeLaUrl(query) {
  return {
    search: query.search,
    deporte: query.deporte,
    ganado: query.ganado,
    temporada: query.temporada,
  };
}

function paginacionDeLaUrl(query) {
  const page = entreLimites(aEntero(query.page, 1), 1, PAGINA_MAXIMA);
  const limit = entreLimites(aEntero(query.limit, LIMITE_POR_DEFECTO), 1, LIMITE_MAXIMO);
  // OFFSET es "cuantas filas me salto": las de todas las paginas anteriores.
  return { page, limit, offset: (page - 1) * limit };
}

function createPartidosController(partidosModel) {
  return {
    /*
      GET /partidos

      El contrato CAMBIA respecto a la P1: antes se devolvia un array pelado
      y ahora un objeto { page, limit, total, items }. Un array no tiene
      donde meter el total, y sin total el cliente no puede pintar "pagina 2
      de 7" ni saber si existe una pagina siguiente.
    */
    async list(req, res, next) {
      try {
        const { page, limit, offset } = paginacionDeLaUrl(req.query);

        const { total, items } = await partidosModel.findAll({
          ...filtrosDeLaUrl(req.query),
          limit,
          offset,
          sort: req.query.sort,
          order: req.query.order,
        });

        res.json({ page, limit, total, items: items.map(toDTO) });
      } catch (err) {
        next(err);
      }
    },

    /*
      GET /partidos/mios — el listado paginado por propietario.

      El dueno sale del TOKEN (req.user.sub), nunca de la URL. Si saliera de
      la URL, cambiar un numero bastaria para ver los de otro.
    */
    async listMine(req, res, next) {
      try {
        const { page, limit, offset } = paginacionDeLaUrl(req.query);

        const { total, items } = await partidosModel.findByOwner(req.user.sub, {
          ...filtrosDeLaUrl(req.query),
          limit,
          offset,
          sort: req.query.sort,
          order: req.query.order,
        });

        res.json({ page, limit, total, items: items.map(toDTO) });
      } catch (err) {
        next(err);
      }
    },

    async detail(req, res, next) {
      try {
        const id = idDeRuta(req.params.id);
        if (id === null) return res.status(404).json({ error: "Partido no encontrado" });

        const partido = await partidosModel.findById(id);
        if (!partido) return res.status(404).json({ error: "Partido no encontrado" });

        res.json(toDTO(partido));
      } catch (err) {
        next(err);
      }
    },

    /*
      POST /partidos

      El userId NO se lee del cuerpo: se pone desde el token. Aunque alguien
      mande {"userId": 2}, el esquema de Zod ya lo ha descartado antes de
      llegar aqui, y aunque no lo hiciera esta linea lo pisaria igual. Dos
      barreras para lo mismo, porque crear partidos a nombre de otro es
      exactamente lo que no puede pasar.
    */
    async create(req, res, next) {
      try {
        const creado = await partidosModel.create({
          ...req.body,
          userId: req.user.sub,
        });

        // 201 y la cabecera Location, que dice donde ha quedado el recurso.
        res.status(201).location(`/partidos/${creado.id}`).json(toDTO(creado));
      } catch (err) {
        next(err);
      }
    },

    /*
      PUT /partidos/:id — sustitucion entera.

      El orden de las comprobaciones importa y no es casual:
        1. buscar      -> si no esta, 404
        2. permisos    -> si no es tuyo y no eres admin, 403
        3. modificar

      Si se comprobaran los permisos antes de buscar, habria que contestar
      403 sobre partidos que ni existen.
    */
    async replace(req, res, next) {
      try {
        const id = idDeRuta(req.params.id);
        if (id === null) return res.status(404).json({ error: "Partido no encontrado" });

        const existente = await partidosModel.findById(id);
        if (!existente) return res.status(404).json({ error: "Partido no encontrado" });

        if (!puedeTocar(req.user, existente)) {
          return res.status(403).json({ error: "Este partido no es tuyo." });
        }

        const actualizado = await partidosModel.replace(id, req.body);
        res.json(toDTO(actualizado));
      } catch (err) {
        next(err);
      }
    },

    async patch(req, res, next) {
      try {
        const id = idDeRuta(req.params.id);
        if (id === null) return res.status(404).json({ error: "Partido no encontrado" });

        const existente = await partidosModel.findById(id);
        if (!existente) return res.status(404).json({ error: "Partido no encontrado" });

        if (!puedeTocar(req.user, existente)) {
          return res.status(403).json({ error: "Este partido no es tuyo." });
        }

        const actualizado = await partidosModel.patch(id, req.body);
        res.json(toDTO(actualizado));
      } catch (err) {
        next(err);
      }
    },

    async remove(req, res, next) {
      try {
        const id = idDeRuta(req.params.id);
        if (id === null) return res.status(404).json({ error: "Partido no encontrado" });

        const existente = await partidosModel.findById(id);
        if (!existente) return res.status(404).json({ error: "Partido no encontrado" });

        if (!puedeTocar(req.user, existente)) {
          return res.status(403).json({ error: "Este partido no es tuyo." });
        }

        await partidosModel.remove(id);

        // 204: ha ido bien y no hay nada que devolver. send() sin cuerpo.
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },

    /*
      GET /partidos/stats

      Acepta los mismos filtros que el listado, asi que se puede pedir, por
      ejemplo, el porcentaje de victorias solo en tenis. Y con ?mias=true
      las del usuario que ha iniciado sesion.
    */
    async stats(req, res, next) {
      try {
        const filtros = filtrosDeLaUrl(req.query);
        if (req.query.mias === "true" && req.user) filtros.userId = req.user.sub;

        res.json(await partidosModel.stats(filtros));
      } catch (err) {
        next(err);
      }
    },

    // GET /partidos/resumen — la consulta agregada propia (GROUP BY deporte).
    async resumen(req, res, next) {
      try {
        const filtros = filtrosDeLaUrl(req.query);
        if (req.query.mias === "true" && req.user) filtros.userId = req.user.sub;

        res.json({ items: await partidosModel.resumenPorDeporte(filtros) });
      } catch (err) {
        next(err);
      }
    },
  };
}

module.exports = {
  createPartidosController,
  aEntero,
  idDeRuta,
  LIMITE_MAXIMO,
  LIMITE_POR_DEFECTO,
};

/*
  src/routes/partidos.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Quien puede hacer que:

    GET    /partidos           cualquiera
    GET    /partidos/stats     cualquiera (con token, ademas acepta ?mias=true)
    GET    /partidos/resumen   cualquiera (idem)
    GET    /partidos/mios      hay que haber iniciado sesion
    GET    /partidos/:id       cualquiera
    POST   /partidos           hay que haber iniciado sesion
    PUT    /partidos/:id       el dueno, o un administrador
    PATCH  /partidos/:id       el dueno, o un administrador
    DELETE /partidos/:id       el dueno, o un administrador

  Leer es publico y escribir no: es lo mismo que pasa en cualquier red
  social donde se pueden ver las publicaciones sin cuenta.

  El permiso de dueno NO esta aqui sino en el controlador, porque para
  saber de quien es el partido hay que buscarlo primero, y esa busqueda es
  la que decide si en realidad toca un 404.
*/

const express = require("express");
const validate = require("../middleware/validate");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { partidoSchema, partidoPatchSchema } = require("../validators/partidoSchema");

function createPartidosRouter(partidosController) {
  const router = express.Router();

  /*
    EL ORDEN DE ESTAS RUTAS IMPORTA.

    "/stats", "/resumen" y "/mios" van ANTES que "/:id". Express prueba las
    rutas en el orden en que se declaran, y "/:id" encaja con cualquier
    cosa: si estuviera arriba, una peticion a /partidos/stats entraria por
    el detalle con id = "stats" y contestaria 404.
  */
  router.get("/stats", optionalAuth, partidosController.stats);
  router.get("/resumen", optionalAuth, partidosController.resumen);
  router.get("/mios", requireAuth, partidosController.listMine);

  router.get("/", partidosController.list);
  router.get("/:id", partidosController.detail);

  router.post("/", requireAuth, validate(partidoSchema), partidosController.create);

  // PUT con el esquema completo y PATCH con el parcial: esa es la
  // diferencia entre sustituir el partido entero y retocar un campo.
  router.put("/:id", requireAuth, validate(partidoSchema), partidosController.replace);
  router.patch("/:id", requireAuth, validate(partidoPatchSchema), partidosController.patch);

  router.delete("/:id", requireAuth, partidosController.remove);

  return router;
}

module.exports = createPartidosRouter;

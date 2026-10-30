/*
  src/routes/partidos.js — el router
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Fichero deliberadamente fino: solo empareja verbo + ruta con la funcion
  del controlador. Aqui no hay ni logica ni datos.

  Se monta en "/partidos", asi que "/" ya significa "/partidos".
*/

const express = require("express");
const {
  listPartidos,
  getStats,
  getPartido,
  createPartido,
  replacePartido,
  patchPartido,
  deletePartido,
} = require("../controllers/partidosController");

const router = express.Router();

router.get("/", listPartidos);          // listar
router.post("/", createPartido);        // crear

// OJO AL ORDEN: /stats tiene que ir ANTES que /:id.
// Express prueba las rutas de arriba abajo, asi que si /:id fuera antes,
// la palabra "stats" encajaria como si fuera un id y nunca llegariamos aqui.
router.get("/stats", getStats);         // resumen

router.get("/:id", getPartido);         // leer uno
router.put("/:id", replacePartido);     // sustituir entero
router.patch("/:id", patchPartido);     // cambiar algunos campos
router.delete("/:id", deletePartido);   // borrar

module.exports = router;

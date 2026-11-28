/*
  src/app.js — construye y devuelve la aplicacion
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Dos cambios respecto a la P1:

  1. Ya no exporta una app hecha, exporta una FUNCION que recibe la base de
     datos y devuelve la app. Es la inyeccion de dependencias llevada hasta
     arriba: aqui se decide una sola vez de donde salen los datos, y todo lo
     de abajo (modelos, controladores) recibe lo que necesita en vez de
     importarlo por su cuenta. Asi las pruebas montan la misma app con otra
     base de datos sin tocar ni una linea de codigo.

  2. No llama a listen: de eso sigue encargandose server.js.

  El orden de este fichero es el camino que recorre cada peticion, de arriba
  a abajo. Middlewares primero, rutas despues, y los dos manejadores del
  final (404 y errores) al final del todo.
*/

const express = require("express");

const logger = require("./middleware/logger");
const cors = require("./middleware/cors");

const { createUsersModel } = require("./models/usersModel");
const { createPartidosModel } = require("./models/partidosModel");

const { createAuthController } = require("./controllers/authController");
const { createPartidosController } = require("./controllers/partidosController");

const createAuthRouter = require("./routes/auth");
const createPartidosRouter = require("./routes/partidos");

function createApp(db) {
  const app = express();

  // --- middlewares, SIEMPRE antes de las rutas ---
  app.use(cors);
  app.use(express.json()); // convierte el cuerpo JSON en req.body
  app.use(logger); // una linea por peticion

  // --- se montan las piezas: la base de datos baja hasta los modelos ---
  const usersModel = createUsersModel(db);
  const partidosModel = createPartidosModel(db);

  const authController = createAuthController(usersModel);
  const partidosController = createPartidosController(partidosModel);

  // --- rutas ---

  // Comprobacion de vida. Viene de la P1 y sigue sin tocar datos.
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/auth", createAuthRouter(authController));
  app.use("/partidos", createPartidosRouter(partidosController));

  // --- 404 en JSON para cualquier ruta que no exista ---
  // Va despues de todas las rutas: si la peticion llega aqui es que
  // ninguna la ha atendido.
  app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });

  /*
    --- manejador centralizado de errores: SIEMPRE el ultimo ---
    Se reconoce porque recibe CUATRO argumentos empezando por err. Si se le
    quitara el cuarto, Express lo tomaria por un middleware normal y no le
    llegaria ningun error.
  */
  app.use((err, req, res, next) => {
    // La traza completa se queda en la terminal del servidor...
    console.error(err.stack || err);

    // JSON mal escrito en el cuerpo. Se contesta con la misma forma
    // { errors: [...] } que usa el validador, en vez de soltarle al cliente
    // el mensaje interno de Express.
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({
        errors: [{ field: "body", message: "El cuerpo de la peticion no es JSON valido." }],
      });
    }

    /*
      Errores que vienen de PostgreSQL. Si saltan es que algo se ha colado
      por delante del validador, asi que la culpa es del dato que han
      mandado (400) y no del servidor (500). La red de seguridad de la que
      habla db/migration-notes.md, funcionando.

        23514 -> se ha roto un CHECK
        23503 -> se ha roto una clave ajena (un dueno que no existe)
        22P02 -> un texto donde la columna esperaba un numero
    */
    if (["23514", "23503", "22P02"].includes(err.code)) {
      return res.status(400).json({
        errors: [{ field: "body", message: "Algun dato no cumple las reglas de la base de datos." }],
      });
    }

    // ...y al cliente solo le llega un mensaje, nunca la traza. Contar por
    // que ha fallado el servidor es regalar informacion.
    const status = err.status || 500;
    const mensaje = status === 500 ? "Error del servidor" : err.message;
    res.status(status).json({ error: mensaje });
  });

  return app;
}

module.exports = createApp;

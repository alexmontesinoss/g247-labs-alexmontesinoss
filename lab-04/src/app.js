/*
  Starter — src/app.js
  Session 15 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 5 · Session 15 · Practice (AF2) · Pair work

  Paste this file into src/app.js.

  This file BUILDS and EXPORTS the app. It must NOT call app.listen — that
  is server.js's job (keeping them separate lets later labs test the app
  without opening a port). Do NOT change the export.

  ORDER MATTERS. Middleware runs top to bottom: express.json() and the
  logger must be registered BEFORE the routes.
*/

const express = require("express");
const logger = require("./middleware/logger");

const app = express();

// Placeholder data — later labs will move this into a controller and then
// replace it with a database model.
const tasks = [
  { id: 1, title: "Write the API skeleton", done: true, userId: 1 },
  { id: 2, title: "Add a request logger", done: false, userId: 1 },
  { id: 3, title: "Create the first routes", done: false, userId: 2 },
];

// --- application-level middleware (register BEFORE the routes) ---
// El orden manda: estos dos se registran ANTES que las rutas, porque
// Express ejecuta el pipeline de arriba a abajo.

// convierte el cuerpo JSON de la peticion en un objeto, en req.body
app.use(express.json());

// escribe una linea en la terminal por cada peticion que entra
app.use(logger);

// --- routes ---

// comprobacion de que el servidor esta vivo
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// :msg es un parametro de ruta: vale lo que se escriba en esa posicion
// de la direccion, y se lee en req.params.msg
app.get("/echo/:msg", (req, res) => {
  res.json({ echo: req.params.msg });
});

// devuelve el array provisional de arriba
app.get("/tasks", (req, res) => {
  res.json(tasks);
});

// 201 es "Created": el codigo correcto cuando se crea algo nuevo.
// req.body existe gracias a express.json() de mas arriba.
app.post("/tasks", (req, res) => {
  res.status(201).json({ received: req.body });
});

module.exports = app;

/*
  src/server.js — punto de entrada
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Lo primero de todo, cargar el .env: las variables tienen que estar puestas
  ANTES de que nadie las lea.

  Su unico trabajo es montar la app con la base de datos de verdad y abrir
  el puerto. Tener el listen fuera de app.js permite probar la aplicacion
  entera sin levantar ningun servidor.
*/

require("dotenv").config();

const db = require("./db");
const createApp = require("./app");

const app = createApp(db);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API de partidos (P2) escuchando en http://localhost:${PORT}`);
});

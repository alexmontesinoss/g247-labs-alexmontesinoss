/*
  src/server.js — punto de entrada
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Su unico trabajo es importar la app y abrir el puerto. Tener el listen
  fuera de app.js permite probar la aplicacion sin levantar el servidor.
*/

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API de partidos escuchando en http://localhost:${PORT}`);
});

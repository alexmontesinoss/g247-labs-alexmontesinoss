/*
  Starter — src/server.js
  Session 15 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 5 · Session 15 · Practice (AF2) · Pair work

  Paste this file into src/server.js. This is the entry point:
  run it with `npm start` (node --watch src/server.js).

  It has ONE job: import the app and start listening. All the routing and
  middleware lives in app.js.
*/

const app = require("./app");

const PORT = process.env.PORT || 3000;

// listen abre el puerto y deja el proceso escuchando peticiones.
// Esta es la unica linea de todo el proyecto que abre un puerto.
app.listen(PORT, () => {
  console.log(`Tasks API listening on http://localhost:${PORT}`);
});

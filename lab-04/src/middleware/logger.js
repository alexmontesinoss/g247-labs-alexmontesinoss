/*
  Starter — src/middleware/logger.js
  Session 15 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 5 · Session 15 · Practice (AF2) · Pair work

  Paste this file into src/middleware/logger.js (drop the "starter_" prefix).

  Do NOT rename `logger` and do NOT change its signature (req, res, next).
  app.js imports it by this name.
*/

// Application-level middleware. Express calls it for every request with
// three arguments: the request, the response, and next — the function that
// passes control to the next middleware or route.
function logger(req, res, next) {
  // una sola linea por peticion: el metodo y la direccion pedida
  console.log(`${req.method} ${req.url}`);

  // next() pasa el control al siguiente middleware o a la ruta.
  // Si no se llama, la peticion se queda colgada para siempre.
  next();
}

module.exports = logger;

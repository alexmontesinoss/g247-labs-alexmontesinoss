/*
  src/routes/auth.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS

  These are PUBLIC routes (no auth middleware) — they are how a caller gets a
  token in the first place.
  Mounted in app.js as: app.use("/auth", buildAuthRouter(authController)).

  Do NOT rename buildAuthRouter. Keep it thin.
*/

const express = require("express");

// El router no lleva logica: solo dice que URL va a que funcion.
// Estas dos rutas NO pasan por el middleware auth, a proposito: si para pedir
// un token hiciera falta un token, no habria forma de entrar nunca.
function buildAuthRouter(authController) {
  const router = express.Router();

  router.post("/register", authController.register);
  router.post("/login", authController.login);

  return router;
}

module.exports = { buildAuthRouter };

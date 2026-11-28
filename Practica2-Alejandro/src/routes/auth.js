/*
  src/routes/auth.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Las rutas de la cuenta. Un router es un mini-Express que se monta debajo
  de un prefijo, asi que aqui "/" significa en realidad "/auth".

  La ruta es una lista de pasos que se leen de izquierda a derecha:
  primero valida, luego ejecuta. Si un paso contesta, los siguientes ni se
  llaman.
*/

const express = require("express");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { registerSchema, loginSchema } = require("../validators/authSchema");

function createAuthRouter(authController) {
  const router = express.Router();

  router.post("/register", validate(registerSchema), authController.register);
  router.post("/login", validate(loginSchema), authController.login);

  // Esta si necesita token: pregunta por "yo".
  router.get("/me", requireAuth, authController.me);

  return router;
}

module.exports = createAuthRouter;

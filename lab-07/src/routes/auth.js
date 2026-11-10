/*
  Starter — src/routes/auth.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2) · Pair work

  Paste this file into src/routes/auth.js. These are PUBLIC routes (no auth
  middleware) — they are how a caller gets a token in the first place.
  Mounted in app.js as: app.use("/auth", buildAuthRouter(authController)).

  Do NOT rename buildAuthRouter. Keep it thin.
*/

const express = require("express");

function buildAuthRouter(authController) {
  const router = express.Router();

  // TODO: POST "/register" -> authController.register
  // TODO: POST "/login"    -> authController.login

  return router;
}

module.exports = { buildAuthRouter };

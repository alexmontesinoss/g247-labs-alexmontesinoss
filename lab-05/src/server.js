/*
  Starter — src/server.js
  Session 18 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 6 · Session 18 · Practice (AF2) · Pair work

  Paste this file into src/server.js. It is UNCHANGED from Session 15 — its
  only job is to import the app and start listening. Keeping app.listen out
  of app.js is what lets the tests import the app without opening a port.

  Run it with `npm start` (node --watch src/server.js).
*/

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Tasks API listening on http://localhost:${PORT}`);
});

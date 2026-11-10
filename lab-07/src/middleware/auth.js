/*
  src/middleware/auth.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2)

  This is AUTHENTICATION: prove WHO the caller is. It runs in front of the
  protected routes (app.use("/tasks", auth, tasksRouter)), verifies the JWT,
  and attaches the decoded payload to req.user. It does NOT decide what the
  caller is allowed to do — that is AUTHORIZATION, and it lives in the
  controllers (the ownership 403 check). auth != authorization.

  Do NOT rename `auth` and do NOT change its (req, res, next) signature.

  JWT_SECRET comes from the environment. Set it before starting the app;
  src/server.js checks that it is present. Never commit a real secret.
*/

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// El token viaja en una cabecera con esta forma:
//   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// "Bearer" quiere decir "al portador": quien lleve este papel, pasa.
const PREFIJO = "Bearer ";

function auth(req, res, next) {
  // Si no viene la cabecera uso "" para no tener que comprobar undefined
  // antes de cada cosa.
  const cabecera = req.headers.authorization || "";

  // Solo acepto la cabecera si empieza por "Bearer ". Si viene de cualquier
  // otra forma, para mi es como si no hubiera token.
  const token = cabecera.startsWith(PREFIJO)
    ? cabecera.slice(PREFIJO.length).trim()
    : "";

  if (token === "") {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    // verify hace dos cosas: comprueba que la firma cuadra con JWT_SECRET
    // (o sea, que nadie ha tocado el token) y que no ha caducado. Si algo
    // falla, lanza.
    req.user = jwt.verify(token, JWT_SECRET);

    // Y aqui esta la clave del middleware: si todo va bien NO contesto,
    // llamo a next() y dejo que la peticion siga su camino hacia el
    // controlador. A partir de esta linea, req.user.sub es el id de quien
    // ha llamado, y me lo puedo creer porque la firma lo respalda.
    next();
  } catch (err) {
    // Mismo 401 para un token inventado, uno manipulado y uno caducado.
    // No hace falta dar mas detalle: en los tres casos la respuesta del
    // cliente es la misma, volver a hacer login.
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { auth };

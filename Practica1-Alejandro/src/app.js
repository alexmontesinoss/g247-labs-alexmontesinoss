/*
  src/app.js — construye y exporta la aplicacion
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  No llama a listen: de eso se encarga server.js. El orden de este fichero
  es el pipeline que recorre cada peticion, de arriba a abajo.
*/

const path = require("path");
const express = require("express");
const logger = require("./middleware/logger");
const partidosRouter = require("./routes/partidos");

const app = express();

// --- middleware, SIEMPRE antes de las rutas ---
app.use(express.json()); // convierte el cuerpo JSON en req.body
app.use(logger);         // una linea por peticion

// --- contenido estatico ---
// Todo lo que haya en public/ se sirve tal cual. Al pedir "/" Express
// devuelve public/index.html el solito. Va ANTES del 404 de abajo, si no
// nunca llegaria a mirar en la carpeta.
app.use(express.static(path.join(__dirname, "..", "public")));

// --- rutas ---

// Comprobacion de vida: sirve para saber de un vistazo si la API responde,
// sin tocar datos. Viene del laboratorio 5.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/partidos", partidosRouter);

// --- 404 en JSON para cualquier ruta que no exista ---
// Va despues de todas las rutas: si la peticion llega aqui, es que
// ninguna la ha atendido.
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// --- manejador centralizado de errores: SIEMPRE el ultimo ---
// Se reconoce porque recibe cuatro argumentos, empezando por err.
app.use((err, req, res, next) => {
  // La traza completa se queda en la terminal del servidor...
  console.error(err.stack);

  // Caso especial: express.json() no ha sabido leer el cuerpo porque el
  // JSON venia mal escrito. Lo contamos como un error de validacion mas,
  // con la misma forma { errors: [...] } que usa el resto de la API, en
  // vez de soltarle al cliente el mensaje interno de Express en ingles.
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      errors: [{ field: "body", message: "El cuerpo de la peticion no es JSON valido." }],
    });
  }

  // ...y al cliente solo le llega un mensaje, nunca la traza.
  const status = err.status || 500;
  const mensaje = status === 500 ? "Error del servidor" : err.message;
  res.status(status).json({ error: mensaje });
});

module.exports = app;

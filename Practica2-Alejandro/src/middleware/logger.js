/*
  src/middleware/logger.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Viene del laboratorio 15 y de la P1. Una linea por peticion.

  Se calla durante las pruebas: node --test lanza decenas de peticiones y
  si cada una escribe una linea, el resultado de las pruebas se pierde
  entre el ruido.
*/

function logger(req, res, next) {
  if (process.env.NODE_ENV !== "test") {
    console.log(`${req.method} ${req.url}`);
  }

  // next() pasa el control al siguiente middleware o a la ruta.
  // Si no se llama, la peticion se queda colgada para siempre.
  next();
}

module.exports = logger;

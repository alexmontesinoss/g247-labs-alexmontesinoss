/*
  tests/helpers.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Lo que comparten los tres ficheros de pruebas.

  DECISION IMPORTANTE: estas pruebas van contra PostgreSQL DE VERDAD, no
  contra una base de datos falsa.

  En el laboratorio 6 el modelo se probaba con una falsa, y estaba bien
  porque alli lo que se comprobaba era que el modelo mandase el SQL correcto.
  Aqui se esta probando la API entera, y lo que mas puede fallar es
  justamente lo que una falsa no sabe hacer: que el CHECK salte, que el
  ILIKE no distinga mayusculas, que el ORDER BY ordene de verdad, que el
  OFFSET no repita filas. Una base falsa diria que todo va bien porque la
  habria escrito yo para que lo dijera.

  El precio es que hay que tener PostgreSQL arrancado para pasar las
  pruebas. Esta puesto en el README.

  Antes de cada fichero se reinicia la base entera (borrar, migrar, cargar
  datos). Asi las pruebas siempre parten del mismo sitio: 3 usuarios y 28
  partidos con ids conocidos. Si una prueba dejara basura, la siguiente la
  encontraria, y entonces el resultado dependeria del orden en que se
  ejecutan, que es la peor clase de prueba: la que falla a veces.
*/

require("dotenv").config();

// Que el logger no escriba una linea por peticion y tape el resultado.
process.env.NODE_ENV = "test";

// Para que las pruebas funcionen aunque el .env no tenga secreto puesto.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "secreto-solo-para-las-pruebas";
}

const path = require("path");
const { execFileSync } = require("child_process");

const db = require("../src/db");
const createApp = require("../src/app");
const request = require("supertest");

const app = createApp(db);

/*
  Se reutiliza db/run.js en vez de repetir aqui el borrado y la carga: si
  manana cambia una migracion, las pruebas se enteran solas. process.execPath
  es el propio node con el que se estan ejecutando las pruebas.
*/
function reiniciarBaseDeDatos() {
  execFileSync(process.execPath, [path.join(__dirname, "..", "db", "run.js"), "reset"], {
    stdio: "ignore",
  });
}

// Los tres usuarios que carga db/seed.sql.
const USUARIOS = {
  alex: { email: "alex@cunef.edu", password: "alex1234" },
  lucia: { email: "lucia@cunef.edu", password: "lucia1234" },
  admin: { email: "admin@cunef.edu", password: "admin1234" },
};

async function entrar(quien) {
  const res = await request(app).post("/auth/login").send(USUARIOS[quien]);
  if (res.status !== 200) {
    throw new Error(`No se ha podido entrar como ${quien}: ${res.status} ${res.text}`);
  }
  return { token: res.body.token, user: res.body.user };
}

// Azucar para no escribir la cabecera entera en cada prueba.
function conToken(peticion, token) {
  return peticion.set("Authorization", "Bearer " + token);
}

const PARTIDO_VALIDO = {
  rival: "Equipo de prueba",
  puntos: 3,
  ganado: true,
  deporte: "futbol",
  temporada: "2025-26",
};

module.exports = {
  app,
  db,
  request,
  reiniciarBaseDeDatos,
  entrar,
  conToken,
  USUARIOS,
  PARTIDO_VALIDO,
};

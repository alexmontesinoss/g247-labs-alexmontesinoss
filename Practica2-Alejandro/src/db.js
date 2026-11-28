/*
  src/db.js — la conexion con PostgreSQL
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Un Pool, no una conexion suelta. Abrir una conexion a una base de datos es
  caro (hay saludo, autenticacion y reserva de memoria en el servidor), asi
  que el pool mantiene unas cuantas abiertas y las va prestando. Si abriera
  una por peticion, la API iria lenta y acabaria agotando las conexiones que
  PostgreSQL permite a la vez.

  Este fichero solo CREA el pool. Los modelos no lo importan: lo reciben como
  parametro. Asi en las pruebas se les puede pasar otra cosa.
*/

require("dotenv").config();

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL. Copia .env.example a .env y ajustalo.");
}

const db = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = db;

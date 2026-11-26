/*
  db/run.js — ejecutor de migraciones y datos iniciales
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Tres ordenes:

    npm run db:migrate   aplica las migraciones que falten, en orden
    npm run db:seed      carga los datos iniciales
    npm run db:reset     borra las tablas y lo hace todo de nuevo

  Por que un fichero de migraciones por cambio y no un unico schema.sql:
  porque el esquema de una base de datos crece, y hay que poder llevarlo de
  una version a la siguiente SIN borrar lo que ya hay dentro. Cada migracion
  es un paso, los pasos van numerados, y se aplican en orden.

  Para saber cuales se han aplicado ya, se guarda el nombre de cada una en
  una tabla aparte. Asi "npm run db:migrate" se puede ejecutar las veces que
  quieras: las que ya estan, no se repiten.
*/

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const CARPETA = path.join(__dirname, "migrations");

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL. Copia .env.example a .env y ajustalo.");
  process.exit(1);
}

const db = new Pool({ connectionString: process.env.DATABASE_URL });

// La tabla donde se apunta que migraciones se han aplicado ya.
async function prepararRegistro() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre     TEXT PRIMARY KEY,
      aplicada_en TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

function ficherosDeMigracion() {
  // sort() los deja en orden alfabetico, y como van numeradas con ceros
  // delante (001, 002, ...) el orden alfabetico es el orden correcto.
  return fs
    .readdirSync(CARPETA)
    .filter((nombre) => nombre.endsWith(".sql"))
    .sort();
}

async function migrate() {
  await prepararRegistro();

  const { rows } = await db.query("SELECT nombre FROM schema_migrations");
  const yaAplicadas = new Set(rows.map((fila) => fila.nombre));

  let aplicadas = 0;

  for (const nombre of ficherosDeMigracion()) {
    if (yaAplicadas.has(nombre)) {
      console.log(`  = ${nombre} (ya estaba)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(CARPETA, nombre), "utf8");

    /*
      Cada migracion va dentro de una TRANSACCION: o entra entera o no entra
      nada. Si una migracion tiene tres sentencias y la tercera falla, sin
      transaccion te quedarias con las dos primeras aplicadas y la base de
      datos a medias, que es el peor sitio posible donde estar.
    */
    const cliente = await db.connect();
    try {
      await cliente.query("BEGIN");
      await cliente.query(sql);
      await cliente.query("INSERT INTO schema_migrations (nombre) VALUES ($1)", [nombre]);
      await cliente.query("COMMIT");
      console.log(`  + ${nombre}`);
      aplicadas++;
    } catch (err) {
      await cliente.query("ROLLBACK");
      console.error(`  ! ${nombre} fallo, no se ha aplicado nada de este fichero`);
      throw err;
    } finally {
      cliente.release();
    }
  }

  console.log(aplicadas === 0 ? "Nada que aplicar." : `${aplicadas} migracion(es) aplicadas.`);
}

async function seed() {
  const sql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
  await db.query(sql);

  const usuarios = await db.query("SELECT COUNT(*) FROM users");
  const partidos = await db.query("SELECT COUNT(*) FROM partidos");
  console.log(`Datos iniciales cargados: ${usuarios.rows[0].count} usuarios y ${partidos.rows[0].count} partidos.`);
}

async function reset() {
  // El orden importa: partidos apunta a users, asi que se borra primero.
  await db.query("DROP TABLE IF EXISTS partidos");
  await db.query("DROP TABLE IF EXISTS users");
  await db.query("DROP TABLE IF EXISTS schema_migrations");
  console.log("Tablas borradas.");
  await migrate();
  await seed();
}

const orden = process.argv[2];

const ordenes = { migrate, seed, reset };

if (!ordenes[orden]) {
  console.error("Uso: node db/run.js migrate | seed | reset");
  process.exit(1);
}

ordenes[orden]()
  .then(() => db.end())
  .catch((err) => {
    console.error(err.message);
    db.end();
    process.exit(1);
  });

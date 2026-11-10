/*
  tests/auth.test.js — registro y acceso

  OJO con la primera linea: JWT_SECRET tiene que estar puesto ANTES de los
  require. Tanto middleware/auth.js como controllers/authController.js lo leen
  al cargarse, una sola vez, no en cada peticion. Si se pusiera despues, los
  modulos ya se habrian quedado con undefined.
*/

process.env.JWT_SECRET = "secreto-solo-para-las-pruebas";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { buildApp } = require("../src/app");
const { createFakeDb } = require("./helpers/fakeDb");

function setup() {
  const db = createFakeDb();
  return { db, app: buildApp(db) };
}

const CORREO = "alex@cunef.edu";
const CLAVE = "contrasena123";

async function registrar(app, email = CORREO, password = CLAVE) {
  return request(app).post("/auth/register").send({ email, password });
}

test("el registro devuelve 201 con id y correo, y nada mas", async () => {
  const { app } = setup();
  const r = await registrar(app);

  assert.equal(r.status, 201);
  assert.equal(r.body.email, CORREO);
  assert.ok(Number.isInteger(r.body.id));
  // La respuesta tiene EXACTAMENTE dos campos: ni el hash ni el papel salen
  assert.deepEqual(Object.keys(r.body).sort(), ["email", "id"]);
});

test("la contrasena no se guarda: se guarda su hash de bcrypt", async () => {
  const { db, app } = setup();
  await registrar(app);

  const guardado = db.users[0];
  assert.notEqual(guardado.password_hash, CLAVE);
  // $2a$ o $2b$ es la marca de bcrypt, y el 10 que sigue es el coste
  assert.ok(guardado.password_hash.startsWith("$2"));
  assert.ok(guardado.password_hash.includes("$10$"));
});

test("un correo repetido devuelve 409 y no 400", async () => {
  const { app } = setup();
  await registrar(app);
  const r = await registrar(app, CORREO, "otracosa123");

  assert.equal(r.status, 409);
});

test("una contrasena de menos de 8 caracteres devuelve 400", async () => {
  const { app } = setup();
  const r = await registrar(app, "otro@cunef.edu", "corta");

  assert.equal(r.status, 400);
});

test("una contrasena de mas de 72 bytes se rechaza, no se corta", async () => {
  const { app } = setup();
  // 73 caracteres ASCII = 73 bytes, uno por encima del limite de bcrypt
  const r = await registrar(app, "otro@cunef.edu", "a".repeat(73));

  assert.equal(r.status, 400);
});

test("el limite son BYTES, no letras: 40 enes son 80 bytes", async () => {
  const { app } = setup();
  // Cada "n" con virgulilla ocupa 2 bytes en UTF-8, asi que 40 son 80 bytes
  const clave = "ñ".repeat(40);
  assert.equal(clave.length, 40);
  assert.equal(Buffer.byteLength(clave, "utf8"), 80);

  const r = await registrar(app, "otro@cunef.edu", clave);
  assert.equal(r.status, 400);
});

test("el login devuelve 200 y un token con sub, role y una hora de vida", async () => {
  const { app } = setup();
  await registrar(app);

  const r = await request(app).post("/auth/login").send({ email: CORREO, password: CLAVE });
  assert.equal(r.status, 200);
  assert.ok(typeof r.body.token === "string");

  const dentro = jwt.decode(r.body.token);
  assert.equal(dentro.sub, 1);
  assert.equal(dentro.role, "user");
  assert.equal(dentro.exp - dentro.iat, 3600); // una hora exacta
});

test("el login con la contrasena mal devuelve 401", async () => {
  const { app } = setup();
  await registrar(app);

  const r = await request(app).post("/auth/login").send({ email: CORREO, password: "me-la-invento" });
  assert.equal(r.status, 401);
});

test("un correo que no existe da el MISMO 401 y el mismo mensaje", async () => {
  const { app } = setup();
  await registrar(app);

  const malaClave = await request(app).post("/auth/login")
    .send({ email: CORREO, password: "me-la-invento" });
  const noExiste = await request(app).post("/auth/login")
    .send({ email: "nadie@cunef.edu", password: CLAVE });

  assert.equal(noExiste.status, malaClave.status);
  // Si las respuestas se diferenciasen, se podria averiguar quien esta
  // registrado probando correos. Eso es enumeracion de usuarios.
  assert.deepEqual(noExiste.body, malaClave.body);
});

test("las consultas de usuarios van parametrizadas", async () => {
  const { db, app } = setup();
  const ataque = "alex@cunef.edu' OR '1'='1";

  await request(app).post("/auth/login").send({ email: ataque, password: CLAVE });

  const llamada = db.calls.at(-1);
  assert.match(llamada.text, /WHERE email = \$1/);
  assert.equal(llamada.text.includes(ataque), false);
  assert.deepEqual(llamada.params, [ataque]);
});

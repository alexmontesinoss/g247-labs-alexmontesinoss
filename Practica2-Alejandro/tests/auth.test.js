/*
  tests/auth.test.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Registro, inicio de sesion y token.
*/

const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");

const { app, db, request, reiniciarBaseDeDatos, entrar, conToken, USUARIOS } = require("./helpers");

before(() => reiniciarBaseDeDatos());
after(() => db.end()); // sin esto el proceso se queda abierto esperando al pool

describe("POST /auth/register", () => {
  test("crea la cuenta, devuelve 201 y un token", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "nuevo@cunef.edu", password: "unaclave123" });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, "nuevo@cunef.edu");
    assert.equal(res.body.user.role, "user"); // nadie se registra de admin
    assert.equal(typeof res.body.token, "string");
  });

  test("la respuesta NO lleva la contrasena ni su hash", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "otro@cunef.edu", password: "unaclave123" });

    const texto = JSON.stringify(res.body);
    assert.ok(!texto.includes("password"), "se ha colado algo con 'password'");
    assert.ok(!texto.includes("$2b$"), "se ha colado el hash de bcrypt");
  });

  test("guarda la contrasena cifrada, nunca en claro", async () => {
    await request(app).post("/auth/register").send({ email: "cifrada@cunef.edu", password: "unaclave123" });

    const { rows } = await db.query("SELECT password_hash FROM users WHERE email = $1", ["cifrada@cunef.edu"]);
    assert.notEqual(rows[0].password_hash, "unaclave123");
    assert.ok(rows[0].password_hash.startsWith("$2"), "no parece un hash de bcrypt");
  });

  test("el mismo correo dos veces da 409", async () => {
    await request(app).post("/auth/register").send({ email: "repe@cunef.edu", password: "unaclave123" });
    const res = await request(app).post("/auth/register").send({ email: "repe@cunef.edu", password: "otraclave123" });

    assert.equal(res.status, 409);
  });

  test("correo malo y contrasena corta: 400 con una incidencia por campo", async () => {
    const res = await request(app).post("/auth/register").send({ email: "esto-no-es-un-correo", password: "123" });

    assert.equal(res.status, 400);
    assert.equal(res.body.errors.length, 2);

    const campos = res.body.errors.map((e) => e.field).sort();
    assert.deepEqual(campos, ["email", "password"]);
    assert.ok(res.body.errors.every((e) => typeof e.message === "string" && e.message.length > 0));
  });

  test("una contrasena de mas de 72 BYTES se rechaza", async () => {
    // 40 enes con virgulilla = 40 caracteres pero 80 bytes. Si se midieran
    // caracteres esto pasaria, y bcrypt ignoraria en silencio lo que sobra.
    const clave = "ñ".repeat(40);
    assert.equal(clave.length, 40);
    assert.equal(Buffer.byteLength(clave, "utf8"), 80);

    const res = await request(app).post("/auth/register").send({ email: "larga@cunef.edu", password: clave });
    assert.equal(res.status, 400);
  });
});

describe("POST /auth/login", () => {
  test("con los datos buenos da 200 y token", async () => {
    const res = await request(app).post("/auth/login").send(USUARIOS.alex);

    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, "alex@cunef.edu");
    assert.equal(typeof res.body.token, "string");
  });

  test("contrasena equivocada: 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "alex@cunef.edu", password: "no-es-esta" });

    assert.equal(res.status, 401);
  });

  test("correo que no existe: 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nadie@cunef.edu", password: "no-es-esta" });

    assert.equal(res.status, 401);
  });

  test("los dos fallos contestan EXACTAMENTE lo mismo (enumeracion de usuarios)", async () => {
    const malaClave = await request(app).post("/auth/login").send({ email: "alex@cunef.edu", password: "mal" });
    const sinCuenta = await request(app).post("/auth/login").send({ email: "nadie@cunef.edu", password: "mal" });

    assert.equal(malaClave.status, sinCuenta.status);
    assert.deepEqual(malaClave.body, sinCuenta.body);
  });

  test("el correo no distingue mayusculas", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "ALEX@CUNEF.EDU", password: "alex1234" });

    assert.equal(res.status, 200);
  });
});

describe("el token", () => {
  test("lleva quien eres y tu rol, y nada mas", async () => {
    const { token } = await entrar("admin");

    // La parte de en medio de un JWT es base64: se puede LEER sin secreto.
    // Por eso ahi no se mete nada privado.
    const contenido = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());

    assert.equal(contenido.role, "admin");
    assert.equal(typeof contenido.sub, "number");
    assert.ok(contenido.exp > contenido.iat, "el token tiene que caducar");
    assert.ok(!("password" in contenido) && !("email" in contenido));
  });

  test("GET /auth/me sin token: 401", async () => {
    const res = await request(app).get("/auth/me");
    assert.equal(res.status, 401);
  });

  test("GET /auth/me con token: devuelve quien soy", async () => {
    const { token } = await entrar("lucia");
    const res = await conToken(request(app).get("/auth/me"), token);

    assert.equal(res.status, 200);
    assert.equal(res.body.email, "lucia@cunef.edu");
  });

  test("un token manipulado: 401", async () => {
    const { token } = await entrar("alex");

    // Se cambia el rol a admin y se vuelve a montar el token. La firma ya
    // no cuadra, asi que no deberia valer para nada.
    const [cabecera, , firma] = token.split(".");
    const falso = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    falso.role = "admin";
    const cargaFalsa = Buffer.from(JSON.stringify(falso)).toString("base64url");

    const res = await conToken(request(app).get("/auth/me"), `${cabecera}.${cargaFalsa}.${firma}`);
    assert.equal(res.status, 401);
  });

  test("sin la palabra Bearer delante: 401", async () => {
    const { token } = await entrar("alex");
    const res = await request(app).get("/auth/me").set("Authorization", token);

    assert.equal(res.status, 401);
  });
});

/*
  tests/tasks.test.js — rutas protegidas, permisos, validacion y paginacion

  Igual que en auth.test.js, JWT_SECRET va ANTES de los require.
*/

process.env.JWT_SECRET = "secreto-solo-para-las-pruebas";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { buildApp } = require("../src/app");
const { createFakeDb } = require("./helpers/fakeDb");
const { taskSchema } = require("../src/validators/taskSchema");

const CLAVE = "contrasena123";

// Registra dos usuarios y devuelve la app con un token para cada uno, que es
// lo que hace falta para probar los permisos: uno crea y el otro intenta.
async function setup() {
  const db = createFakeDb();
  const app = buildApp(db);

  const tokenDe = async (email) => {
    await request(app).post("/auth/register").send({ email, password: CLAVE });
    const r = await request(app).post("/auth/login").send({ email, password: CLAVE });
    return r.body.token;
  };

  const alex = await tokenDe("alex@cunef.edu");
  const beto = await tokenDe("beto@cunef.edu");
  return { db, app, alex, beto };
}

const con = (peticion, token) => peticion.set("Authorization", "Bearer " + token);

async function crearTarea(app, token, title = "Una tarea") {
  return con(request(app).post("/tasks"), token).send({ title });
}

// ---------- 401: no se quien eres ----------

test("sin token, las rutas de tareas devuelven 401", async () => {
  const { app } = await setup();
  for (const peticion of [
    request(app).get("/tasks"),
    request(app).get("/tasks/1"),
    request(app).post("/tasks").send({ title: "x" }),
    request(app).delete("/tasks/1"),
  ]) {
    const r = await peticion;
    assert.equal(r.status, 401);
  }
});

test("con un token inventado tambien es 401", async () => {
  const { app } = await setup();
  const r = await con(request(app).get("/tasks"), "esto-no-es-un-token");
  assert.equal(r.status, 401);
});

test("una cabecera sin el Bearer delante cuenta como token ausente", async () => {
  const { app, alex } = await setup();
  const r = await request(app).get("/tasks").set("Authorization", alex);
  assert.equal(r.status, 401);
});

// ---------- crear ----------

test("crear devuelve 201, la cabecera Location y la forma del contrato", async () => {
  const { app, alex } = await setup();
  const r = await crearTarea(app, alex, "Terminar el laboratorio 7");

  assert.equal(r.status, 201);
  assert.equal(r.headers.location, "/tasks/" + r.body.id);
  // userId en camelCase, aunque la columna se llame user_id
  assert.deepEqual(Object.keys(r.body).sort(), ["done", "id", "title", "userId"]);
  assert.equal(r.body.done, false);
});

test("el dueno sale del token, nunca del cuerpo", async () => {
  const { app, alex, beto } = await setup();

  // alex intenta crear una tarea a nombre del usuario 2 (beto)
  const r = await con(request(app).post("/tasks"), alex)
    .send({ title: "Tarea con dueno falseado", userId: 2 });

  assert.equal(r.status, 201);
  assert.equal(r.body.userId, 1); // el suyo, no el que mando

  // y beto no la ve en su listado
  const listado = await con(request(app).get("/tasks"), beto);
  assert.deepEqual(listado.body.items, []);
});

// ---------- 400: validacion de Zod ----------

test("sin title devuelve 400 con los problemas de Zod", async () => {
  const { app, alex } = await setup();
  const r = await con(request(app).post("/tasks"), alex).send({ done: true });

  assert.equal(r.status, 400);
  assert.ok(Array.isArray(r.body.error));
  assert.equal(r.body.error[0].path[0], "title");
});

test("title vacio y done que no es booleano dan DOS problemas, no uno", async () => {
  const { app, alex } = await setup();
  const r = await con(request(app).post("/tasks"), alex).send({ title: "", done: "si" });

  assert.equal(r.status, 400);
  assert.equal(r.body.error.length, 2);
});

test("el 400 llega antes de tocar la base de datos", async () => {
  const { db, app, alex } = await setup();
  const antes = db.tasks.length;

  await con(request(app).post("/tasks"), alex).send({ done: true });

  assert.equal(db.tasks.length, antes); // no se ha guardado nada
});

// Este es el que de verdad protege al dueno, y lo descubri rompiendo el
// controlador a proposito: cambie "userId: req.user.sub" por
// "req.body.userId || req.user.sub" y NO fallo ninguna prueba. El motivo es
// que Zod tira los campos que no estan declarados en el esquema, asi que
// req.body.userId ya era undefined antes de llegar al controlador.
// O sea: la proteccion no estaba donde yo creia. Esta prueba vigila el sitio
// correcto, y se pondria en rojo si alguien hiciera el esquema permisivo.
test("el esquema tira los campos que no estan declarados", () => {
  const r = taskSchema.safeParse({ title: "x", userId: 99, role: "admin" });

  assert.equal(r.success, true);
  assert.deepEqual(Object.keys(r.data).sort(), ["done", "title"]);
  assert.equal(r.data.userId, undefined);
});

// ---------- 403: se quien eres y por eso no te dejo ----------

test("tocar una tarea ajena devuelve 403 en GET, PUT y DELETE", async () => {
  const { app, alex, beto } = await setup();
  const creada = await crearTarea(app, alex);
  const id = creada.body.id;

  const leer = await con(request(app).get("/tasks/" + id), beto);
  const editar = await con(request(app).put("/tasks/" + id), beto).send({ title: "mia ahora" });
  const borrar = await con(request(app).delete("/tasks/" + id), beto);

  assert.equal(leer.status, 403);
  assert.equal(editar.status, 403);
  assert.equal(borrar.status, 403);
});

test("un 403 no deja cambiar nada de verdad", async () => {
  const { db, app, alex, beto } = await setup();
  const creada = await crearTarea(app, alex, "Titulo original");
  const id = creada.body.id;

  await con(request(app).put("/tasks/" + id), beto).send({ title: "secuestrada" });
  await con(request(app).delete("/tasks/" + id), beto);

  const sigue = db.tasks.find((t) => t.id === id);
  assert.equal(sigue.title, "Titulo original");
});

test("el 404 va antes que el 403: una tarea que no existe es 404", async () => {
  const { app, beto } = await setup();
  const r = await con(request(app).get("/tasks/999"), beto);

  // Si contestara 403, estaria diciendo que ese id existe pero es de otro
  assert.equal(r.status, 404);
});

// ---------- el camino feliz ----------

test("el dueno si puede leer, editar y borrar lo suyo", async () => {
  const { app, alex } = await setup();
  const id = (await crearTarea(app, alex, "Original")).body.id;

  const leer = await con(request(app).get("/tasks/" + id), alex);
  assert.equal(leer.status, 200);
  assert.equal(leer.body.title, "Original");

  const editar = await con(request(app).put("/tasks/" + id), alex)
    .send({ title: "Cambiada", done: true });
  assert.equal(editar.status, 200);
  assert.equal(editar.body.title, "Cambiada");
  assert.equal(editar.body.done, true);

  const borrar = await con(request(app).delete("/tasks/" + id), alex);
  assert.equal(borrar.status, 204);
  assert.deepEqual(borrar.body, {}); // 204 no lleva cuerpo

  const despues = await con(request(app).get("/tasks/" + id), alex);
  assert.equal(despues.status, 404);
});

// ---------- paginacion ----------

test("el listado devuelve page, limit e items", async () => {
  const { app, alex } = await setup();
  await crearTarea(app, alex);

  const r = await con(request(app).get("/tasks"), alex);
  assert.equal(r.status, 200);
  assert.deepEqual(Object.keys(r.body).sort(), ["items", "limit", "page"]);
  assert.equal(r.body.page, 1);
  assert.equal(r.body.limit, 20);
});

test("cada usuario solo ve sus propias tareas", async () => {
  const { app, alex, beto } = await setup();
  await crearTarea(app, alex, "De alex");
  await crearTarea(app, beto, "De beto");

  const deAlex = await con(request(app).get("/tasks"), alex);
  const deBeto = await con(request(app).get("/tasks"), beto);

  assert.equal(deAlex.body.items.length, 1);
  assert.equal(deAlex.body.items[0].title, "De alex");
  assert.equal(deBeto.body.items.length, 1);
  assert.equal(deBeto.body.items[0].title, "De beto");
});

test("paginas distintas devuelven tareas distintas", async () => {
  const { app, alex } = await setup();
  for (let i = 1; i <= 5; i++) await crearTarea(app, alex, "Tarea " + i);

  const uno = await con(request(app).get("/tasks?page=1&limit=2"), alex);
  const dos = await con(request(app).get("/tasks?page=2&limit=2"), alex);

  assert.equal(uno.body.items.length, 2);
  assert.deepEqual(
    uno.body.items.map((t) => t.title),
    ["Tarea 1", "Tarea 2"]
  );
  assert.deepEqual(
    dos.body.items.map((t) => t.title),
    ["Tarea 3", "Tarea 4"]
  );
});

test("limit=999 se recorta a 100 y page=0 se corrige a 1", async () => {
  const { app, alex } = await setup();
  const r = await con(request(app).get("/tasks?limit=999&page=0"), alex);

  assert.equal(r.body.limit, 100);
  assert.equal(r.body.page, 1);
});

test("lo que no es un entero usa los valores por defecto", async () => {
  const { app, alex } = await setup();

  for (const consulta of ["?limit=abc&page=xyz", "?limit=2.5&page=1.5", "?limit=Infinity"]) {
    const r = await con(request(app).get("/tasks" + consulta), alex);
    assert.equal(r.body.limit, 20, "fallo con " + consulta);
    assert.equal(r.body.page, 1, "fallo con " + consulta);
  }
});

test("el offset se calcula bien: la pagina 3 con limit 2 se salta 4 filas", async () => {
  const { db, app, alex } = await setup();
  for (let i = 1; i <= 6; i++) await crearTarea(app, alex, "Tarea " + i);

  await con(request(app).get("/tasks?page=3&limit=2"), alex);

  // params de findByOwner: [userId, limit, offset]
  const llamada = db.calls.at(-1);
  assert.deepEqual(llamada.params, [1, 2, 4]);
});

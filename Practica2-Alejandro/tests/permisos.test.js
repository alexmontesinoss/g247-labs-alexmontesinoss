/*
  tests/permisos.test.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  La parte de ESCRITURA: crear, modificar, borrar, y sobre todo quien puede
  hacer cada cosa. Es la parte nueva de la P2 y la que mas me importa que
  este bien probada, porque un fallo aqui no da un error raro: deja que
  cualquiera toque los partidos de otro.

  Estas pruebas si cambian la base de datos, asi que cada una crea lo suyo
  en vez de dar por hecho que un partido concreto sigue como estaba.
*/

const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");

const { app, db, request, reiniciarBaseDeDatos, entrar, conToken, PARTIDO_VALIDO } = require("./helpers");

before(() => reiniciarBaseDeDatos());
after(() => db.end());

// Crea un partido a nombre de quien diga y devuelve el cuerpo de la respuesta.
async function crearComo(quien, cambios = {}) {
  const { token, user } = await entrar(quien);
  const res = await conToken(request(app).post("/partidos"), token).send({ ...PARTIDO_VALIDO, ...cambios });

  assert.equal(res.status, 201, "no se ha podido crear el partido de apoyo: " + res.text);
  return { partido: res.body, token, user };
}

describe("POST /partidos", () => {
  test("sin token: 401", async () => {
    const res = await request(app).post("/partidos").send(PARTIDO_VALIDO);
    assert.equal(res.status, 401);
  });

  test("con token y datos buenos: 201, el partido y la cabecera Location", async () => {
    const { token, user } = await entrar("alex");
    const res = await conToken(request(app).post("/partidos"), token).send(PARTIDO_VALIDO);

    assert.equal(res.status, 201);
    assert.equal(res.body.rival, PARTIDO_VALIDO.rival);
    assert.equal(res.body.userId, user.id);
    assert.equal(res.headers.location, `/partidos/${res.body.id}`);
  });

  test("lo creado se puede volver a pedir y esta guardado de verdad", async () => {
    const { partido } = await crearComo("alex", { rival: "Comprobacion de guardado" });

    const res = await request(app).get("/partidos/" + partido.id);
    assert.equal(res.status, 200);
    assert.equal(res.body.rival, "Comprobacion de guardado");
  });

  test("un cuerpo vacio da 400 con los cuatro campos obligatorios", async () => {
    const { token } = await entrar("alex");
    const res = await conToken(request(app).post("/partidos"), token).send({});

    assert.equal(res.status, 400);
    const campos = res.body.errors.map((e) => e.field).sort();
    assert.deepEqual(campos, ["deporte", "ganado", "puntos", "rival"]);
  });

  test("cada campo malo trae su propia incidencia", async () => {
    const { token } = await entrar("alex");
    const res = await conToken(request(app).post("/partidos"), token).send({
      rival: "X", // muy corto
      puntos: 500, // fuera de rango
      ganado: "si", // no es booleano
      deporte: "ajedrez", // no esta en la lista
      temporada: "2015", // formato malo
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.errors.length, 5);
    assert.ok(res.body.errors.every((e) => e.field && e.message));
  });

  test("los puntos como texto se rechazan, no se convierten", async () => {
    const { token } = await entrar("alex");
    const res = await conToken(request(app).post("/partidos"), token).send({ ...PARTIDO_VALIDO, puntos: "3" });

    assert.equal(res.status, 400);
  });

  test("LOS CAMPOS QUE NO TOCAN SE DESCARTAN (userId, id, role)", async () => {
    const { token, user } = await entrar("alex");
    const res = await conToken(request(app).post("/partidos"), token).send({
      ...PARTIDO_VALIDO,
      userId: 2, // intento de crearlo a nombre de lucia
      id: 777, // intento de elegir el id
      role: "admin",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.userId, user.id, "se ha podido crear un partido a nombre de otro");
    assert.notEqual(res.body.id, 777);
  });

  test("la temporada se puede omitir y queda en null", async () => {
    const { token } = await entrar("alex");
    const sinTemporada = { ...PARTIDO_VALIDO };
    delete sinTemporada.temporada;

    const res = await conToken(request(app).post("/partidos"), token).send(sinTemporada);

    assert.equal(res.status, 201);
    assert.equal(res.body.temporada, null);
  });

  test("un cuerpo que no es JSON valido da 400 con la misma forma que el validador", async () => {
    const { token } = await entrar("alex");
    const res = await conToken(request(app).post("/partidos"), token)
      .set("Content-Type", "application/json")
      .send('{"rival": roto}');

    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
  });
});

describe("permisos sobre un partido de otro", () => {
  test("PATCH de un partido ajeno: 403", async () => {
    const { partido } = await crearComo("alex");
    const lucia = await entrar("lucia");

    const res = await conToken(request(app).patch("/partidos/" + partido.id), lucia.token).send({ puntos: 1 });
    assert.equal(res.status, 403);
  });

  test("PUT de un partido ajeno: 403", async () => {
    const { partido } = await crearComo("alex");
    const lucia = await entrar("lucia");

    const res = await conToken(request(app).put("/partidos/" + partido.id), lucia.token).send(PARTIDO_VALIDO);
    assert.equal(res.status, 403);
  });

  test("DELETE de un partido ajeno: 403 y el partido sigue ahi", async () => {
    const { partido } = await crearComo("alex");
    const lucia = await entrar("lucia");

    const res = await conToken(request(app).delete("/partidos/" + partido.id), lucia.token);
    assert.equal(res.status, 403);

    const sigue = await request(app).get("/partidos/" + partido.id);
    assert.equal(sigue.status, 200);
  });

  test("un partido que no existe da 404 aunque no sea tuyo (primero se busca)", async () => {
    const lucia = await entrar("lucia");
    const res = await conToken(request(app).patch("/partidos/99999"), lucia.token).send({ puntos: 1 });

    assert.equal(res.status, 404);
  });

  test("sin token, escribir da 401 y no 403", async () => {
    const { partido } = await crearComo("alex");

    assert.equal((await request(app).patch("/partidos/" + partido.id).send({ puntos: 1 })).status, 401);
    assert.equal((await request(app).delete("/partidos/" + partido.id)).status, 401);
  });
});

describe("PATCH /partidos/:id", () => {
  test("cambia solo lo que mandas", async () => {
    const { partido, token } = await crearComo("alex", { rival: "Antes", puntos: 10 });

    const res = await conToken(request(app).patch("/partidos/" + partido.id), token).send({ rival: "Despues" });

    assert.equal(res.status, 200);
    assert.equal(res.body.rival, "Despues");
    assert.equal(res.body.puntos, 10, "ha pisado un campo que no se mandaba");
    assert.equal(res.body.temporada, PARTIDO_VALIDO.temporada);
  });

  test("puntos: 0 se guarda (la trampa de || en vez de ??)", async () => {
    const { partido, token } = await crearComo("alex", { puntos: 10 });

    const res = await conToken(request(app).patch("/partidos/" + partido.id), token).send({ puntos: 0 });

    assert.equal(res.status, 200);
    assert.equal(res.body.puntos, 0, "el 0 se ha tratado como 'no mandado'");
  });

  test("ganado: false se guarda (la misma trampa)", async () => {
    const { partido, token } = await crearComo("alex", { ganado: true });

    const res = await conToken(request(app).patch("/partidos/" + partido.id), token).send({ ganado: false });

    assert.equal(res.status, 200);
    assert.equal(res.body.ganado, false, "no se puede marcar un partido como perdido");
  });

  test("temporada: null la borra de verdad", async () => {
    const { partido, token } = await crearComo("alex", { temporada: "2015-16" });

    const res = await conToken(request(app).patch("/partidos/" + partido.id), token).send({ temporada: null });

    assert.equal(res.status, 200);
    assert.equal(res.body.temporada, null);
  });

  test("un PATCH vacio da 400", async () => {
    const { partido, token } = await crearComo("alex");

    const res = await conToken(request(app).patch("/partidos/" + partido.id), token).send({});
    assert.equal(res.status, 400);
  });

  test("un PATCH con un valor malo da 400 y no toca nada", async () => {
    const { partido, token } = await crearComo("alex", { puntos: 7 });

    const res = await conToken(request(app).patch("/partidos/" + partido.id), token).send({ puntos: 9999 });
    assert.equal(res.status, 400);

    const sigue = await request(app).get("/partidos/" + partido.id);
    assert.equal(sigue.body.puntos, 7);
  });
});

describe("PUT /partidos/:id", () => {
  test("sustituye el partido entero", async () => {
    const { partido, token } = await crearComo("alex", { rival: "Antes", deporte: "futbol" });

    const res = await conToken(request(app).put("/partidos/" + partido.id), token).send({
      rival: "Despues del todo",
      puntos: 42,
      ganado: false,
      deporte: "baloncesto",
      temporada: "2024-25",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.rival, "Despues del todo");
    assert.equal(res.body.deporte, "baloncesto");
    assert.equal(res.body.puntos, 42);
  });

  test("un PUT incompleto da 400: el PUT exige el partido entero", async () => {
    const { partido, token } = await crearComo("alex");

    const res = await conToken(request(app).put("/partidos/" + partido.id), token).send({ rival: "Solo esto" });
    assert.equal(res.status, 400);
  });

  test("un PUT sin temporada la deja en null (esa es la diferencia con PATCH)", async () => {
    const { partido, token } = await crearComo("alex", { temporada: "2015-16" });

    const res = await conToken(request(app).put("/partidos/" + partido.id), token).send({
      rival: "Reemplazado",
      puntos: 1,
      ganado: true,
      deporte: "tenis",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.temporada, null);
  });

  test("el PUT no cambia el dueno", async () => {
    const { partido, token, user } = await crearComo("alex");

    const res = await conToken(request(app).put("/partidos/" + partido.id), token).send(PARTIDO_VALIDO);
    assert.equal(res.body.userId, user.id);
  });
});

describe("DELETE /partidos/:id", () => {
  test("el dueno borra el suyo: 204 sin cuerpo, y luego 404", async () => {
    const { partido, token } = await crearComo("alex");

    const res = await conToken(request(app).delete("/partidos/" + partido.id), token);
    assert.equal(res.status, 204);
    assert.equal(res.text, "");

    const despues = await request(app).get("/partidos/" + partido.id);
    assert.equal(despues.status, 404);
  });

  test("borrar dos veces: la segunda da 404", async () => {
    const { partido, token } = await crearComo("alex");

    await conToken(request(app).delete("/partidos/" + partido.id), token);
    const segunda = await conToken(request(app).delete("/partidos/" + partido.id), token);

    assert.equal(segunda.status, 404);
  });
});

describe("el administrador", () => {
  test("puede modificar el partido de otro", async () => {
    const { partido, user } = await crearComo("alex");
    const admin = await entrar("admin");

    const res = await conToken(request(app).patch("/partidos/" + partido.id), admin.token).send({
      rival: "Corregido por el admin",
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.rival, "Corregido por el admin");
    assert.equal(res.body.userId, user.id, "el admin se ha quedado el partido");
  });

  test("puede borrar el partido de otro", async () => {
    const { partido } = await crearComo("alex");
    const admin = await entrar("admin");

    const res = await conToken(request(app).delete("/partidos/" + partido.id), admin.token);
    assert.equal(res.status, 204);
  });

  test("pero sigue sin poder saltarse la validacion", async () => {
    const { partido } = await crearComo("alex");
    const admin = await entrar("admin");

    const res = await conToken(request(app).patch("/partidos/" + partido.id), admin.token).send({ puntos: -5 });
    assert.equal(res.status, 400);
  });
});

describe("la base de datos como ultima red", () => {
  test("un CHECK que salte se contesta 400, no 500", async () => {
    // Se salta el validador a proposito, llamando al modelo por debajo, para
    // comprobar que el CHECK de la tabla existe y funciona.
    const { createPartidosModel } = require("../src/models/partidosModel");
    const modelo = createPartidosModel(db);

    await assert.rejects(
      () => modelo.create({ rival: "X", puntos: 9999, ganado: true, deporte: "futbol", userId: 1 }),
      (err) => err.code === "23514", // violacion de CHECK
      "la base de datos ha aceptado 9999 puntos"
    );
  });

  test("no se puede crear un partido de un usuario que no existe", async () => {
    const { createPartidosModel } = require("../src/models/partidosModel");
    const modelo = createPartidosModel(db);

    await assert.rejects(
      () => modelo.create({ rival: "Fantasma", puntos: 1, ganado: true, deporte: "futbol", userId: 99999 }),
      (err) => err.code === "23503" // violacion de clave ajena
    );
  });

  test("al borrar un usuario se van sus partidos (ON DELETE CASCADE)", async () => {
    const registro = await request(app)
      .post("/auth/register")
      .send({ email: "efimero@cunef.edu", password: "unaclave123" });

    const token = registro.body.token;
    await conToken(request(app).post("/partidos"), token).send(PARTIDO_VALIDO);

    const antes = await db.query("SELECT COUNT(*)::int AS c FROM partidos WHERE user_id = $1", [registro.body.user.id]);
    assert.equal(antes.rows[0].c, 1);

    await db.query("DELETE FROM users WHERE id = $1", [registro.body.user.id]);

    const despues = await db.query("SELECT COUNT(*)::int AS c FROM partidos WHERE user_id = $1", [registro.body.user.id]);
    assert.equal(despues.rows[0].c, 0);
  });
});

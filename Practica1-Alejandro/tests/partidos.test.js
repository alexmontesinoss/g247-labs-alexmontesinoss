/*
  tests/partidos.test.js
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Mismo montaje que el laboratorio 5: supertest maneja la aplicacion POR
  DENTRO, sin abrir ningun puerto. Eso solo funciona porque src/app.js
  exporta la app y NO llama a app.listen() (de eso se encarga server.js).

  Se lanza con:  npm test
*/

const request = require("supertest");
const app = require("../src/app");

// Un partido valido de referencia. Cada prueba parte de una copia suya
// y cambia solo lo que quiere romper.
const PARTIDO_VALIDO = {
  rival: "Test FC",
  puntos: 3,
  ganado: true,
  deporte: "futbol",
  temporada: "2024-25",
};

// Crea un partido y devuelve el que ha quedado guardado.
async function crearPartido(cambios) {
  const res = await request(app)
    .post("/partidos")
    .send({ ...PARTIDO_VALIDO, ...cambios });
  return res.body;
}

// Manda un partido valido con uno de los campos roto a proposito.
async function intentarCrear(cambios) {
  return request(app)
    .post("/partidos")
    .send({ ...PARTIDO_VALIDO, ...cambios });
}

// Devuelve cuantos partidos hay ahora mismo.
async function cuantosHay() {
  const res = await request(app).get("/partidos");
  return res.body.length;
}

describe("Comprobacion de vida", () => {
  test("GET /health -> 200 y status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  test("una ruta que no existe -> 404 en JSON", async () => {
    const res = await request(app).get("/esto-no-existe");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

describe("Leer partidos", () => {
  test("GET /partidos -> 200 y una lista", async () => {
    const res = await request(app).get("/partidos");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("cada partido trae todos sus campos", async () => {
    const res = await request(app).get("/partidos");
    const primero = res.body[0];
    expect(primero).toHaveProperty("id");
    expect(primero).toHaveProperty("rival");
    expect(primero).toHaveProperty("puntos");
    expect(primero).toHaveProperty("ganado");
    expect(primero).toHaveProperty("deporte");
  });

  test("GET /partidos/:id de uno que existe -> 200", async () => {
    const creado = await crearPartido({ rival: "Para leerlo" });
    const res = await request(app).get(`/partidos/${creado.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(creado.id);
    expect(res.body.rival).toBe("Para leerlo");
  });

  test("GET /partidos/999 -> 404", async () => {
    const res = await request(app).get("/partidos/999");
    expect(res.status).toBe(404);
  });

  test("un id que no es un numero -> 404, no se rompe el servidor", async () => {
    const res = await request(app).get("/partidos/abc");
    expect(res.status).toBe(404);
  });
});

describe("Crear partidos", () => {
  test("POST valido -> 201, el partido creado y la cabecera Location", async () => {
    const res = await request(app).post("/partidos").send(PARTIDO_VALIDO);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(PARTIDO_VALIDO);
    expect(res.body).toHaveProperty("id");
    expect(res.headers.location).toBe(`/partidos/${res.body.id}`);
  });

  test("sin temporada -> se guarda como null, no se queda sin el campo", async () => {
    const sinTemporada = { ...PARTIDO_VALIDO };
    delete sinTemporada.temporada;

    const res = await request(app).post("/partidos").send(sinTemporada);
    expect(res.status).toBe(201);
    expect(res.body.temporada).toBeNull();
  });

  test("el id lo pone el servidor: si el cliente manda uno, se ignora", async () => {
    const res = await intentarCrear({ id: 9999 });
    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe(9999);
  });

  test("los campos que no existen se tiran a la basura", async () => {
    const res = await intentarCrear({ hackeado: "si" });
    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty("hackeado");
  });
});

describe("El validador", () => {
  test("cuerpo vacio -> 400 con un error por cada campo obligatorio", async () => {
    const res = await request(app).post("/partidos").send({});
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);

    const campos = res.body.errors.map((e) => e.field);
    expect(campos).toContain("rival");
    expect(campos).toContain("puntos");
    expect(campos).toContain("ganado");
    expect(campos).toContain("deporte");
  });

  test("devuelve TODOS los fallos de golpe, no solo el primero", async () => {
    const res = await request(app).post("/partidos").send({
      rival: "",
      puntos: -500,
      ganado: "si",
      deporte: "petanca",
      temporada: "2018",
    });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBe(5);
  });

  test("cada error dice de que campo es y por que", async () => {
    const res = await request(app).post("/partidos").send({});
    for (const error of res.body.errors) {
      expect(typeof error.field).toBe("string");
      expect(typeof error.message).toBe("string");
      expect(error.message.length).toBeGreaterThan(0);
    }
  });

  test("un numero entre comillas NO cuela como numero", async () => {
    const res = await intentarCrear({ puntos: "3" });
    expect(res.status).toBe(400);
  });

  test("los puntos tienen que ser enteros", async () => {
    const res = await intentarCrear({ puntos: 2.5 });
    expect(res.status).toBe(400);
  });

  test("los puntos no pueden pasarse del maximo", async () => {
    const res = await intentarCrear({ puntos: 500 });
    expect(res.status).toBe(400);
  });

  test("ganado tiene que ser booleano, no el texto true entrecomillado", async () => {
    const res = await intentarCrear({ ganado: "true" });
    expect(res.status).toBe(400);
  });

  test("un rival de solo espacios no vale", async () => {
    const res = await intentarCrear({ rival: "   " });
    expect(res.status).toBe(400);
  });

  test("el deporte tiene que estar en la lista", async () => {
    const res = await intentarCrear({ deporte: "curling" });
    expect(res.status).toBe(400);
  });

  test("la temporada mal escrita no vale", async () => {
    const res = await intentarCrear({ temporada: "2018" });
    expect(res.status).toBe(400);
  });

  test("la temporada es opcional: null se acepta", async () => {
    const res = await intentarCrear({ temporada: null });
    expect(res.status).toBe(201);
    expect(res.body.temporada).toBeNull();
  });

  test("un POST invalido NO crea nada", async () => {
    const antes = await cuantosHay();
    await request(app).post("/partidos").send({ rival: "x" });
    const despues = await cuantosHay();
    expect(despues).toBe(antes);
  });

  test("un JSON mal escrito -> 400, no 500", async () => {
    const res = await request(app)
      .post("/partidos")
      .set("Content-Type", "application/json")
      .send('{"rival":"roto"');
    expect(res.status).toBe(400);
  });
});

describe("PUT: sustituir el partido entero", () => {
  test("PUT valido -> 200 y el partido sustituido", async () => {
    const creado = await crearPartido({ rival: "Antes" });
    const res = await request(app).put(`/partidos/${creado.id}`).send({
      rival: "Despues",
      puntos: 7,
      ganado: false,
      deporte: "tenis",
      temporada: "2025-26",
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: creado.id, rival: "Despues", puntos: 7 });
  });

  test("sustituye ENTERO: lo que no mandas se pierde", async () => {
    const creado = await crearPartido({ temporada: "2024-25" });
    const res = await request(app).put(`/partidos/${creado.id}`).send({
      rival: "Sin temporada",
      puntos: 1,
      ganado: true,
      deporte: "padel",
    });
    expect(res.status).toBe(200);
    expect(res.body.temporada).toBeNull();
  });

  test("PUT exige el partido completo: sin deporte -> 400", async () => {
    const creado = await crearPartido();
    const res = await request(app)
      .put(`/partidos/${creado.id}`)
      .send({ rival: "Incompleto", puntos: 2, ganado: true });
    expect(res.status).toBe(400);
  });

  test("PUT a uno que no existe -> 404", async () => {
    const res = await request(app).put("/partidos/999").send(PARTIDO_VALIDO);
    expect(res.status).toBe(404);
  });

  test("si no existe manda el 404, aunque los datos tambien esten mal", async () => {
    const res = await request(app).put("/partidos/999").send({ rival: "" });
    expect(res.status).toBe(404);
  });

  test("el id no cambia aunque el cliente mande otro", async () => {
    const creado = await crearPartido();
    const res = await request(app)
      .put(`/partidos/${creado.id}`)
      .send({ ...PARTIDO_VALIDO, id: 777 });
    expect(res.body.id).toBe(creado.id);
  });
});

describe("PATCH: cambiar solo algunos campos", () => {
  test("un solo campo -> 200, y no exige los demas", async () => {
    const creado = await crearPartido({ ganado: true });
    const res = await request(app)
      .patch(`/partidos/${creado.id}`)
      .send({ ganado: false });
    expect(res.status).toBe(200);
    expect(res.body.ganado).toBe(false);
  });

  test("lo que no mandas se queda como estaba", async () => {
    const creado = await crearPartido({ rival: "No me toques" });
    const res = await request(app)
      .patch(`/partidos/${creado.id}`)
      .send({ puntos: 99 });
    expect(res.body.rival).toBe("No me toques");
    expect(res.body.puntos).toBe(99);
  });

  test("lo que mandas tambien se valida -> 400", async () => {
    const creado = await crearPartido();
    const res = await request(app)
      .patch(`/partidos/${creado.id}`)
      .send({ deporte: "curling" });
    expect(res.status).toBe(400);
  });

  test("un PATCH sin nada dentro -> 400", async () => {
    const creado = await crearPartido();
    const res = await request(app).patch(`/partidos/${creado.id}`).send({});
    expect(res.status).toBe(400);
  });

  test("un PATCH con solo campos inventados -> 400", async () => {
    const creado = await crearPartido();
    const res = await request(app)
      .patch(`/partidos/${creado.id}`)
      .send({ loquesea: 1 });
    expect(res.status).toBe(400);
  });

  test("no deja cambiar el id", async () => {
    const creado = await crearPartido();
    const res = await request(app)
      .patch(`/partidos/${creado.id}`)
      .send({ id: 777, puntos: 5 });
    expect(res.body.id).toBe(creado.id);
    expect(res.body.puntos).toBe(5);
  });

  test("PATCH a uno que no existe -> 404", async () => {
    const res = await request(app).patch("/partidos/999").send({ puntos: 1 });
    expect(res.status).toBe(404);
  });
});

describe("Borrar partidos", () => {
  test("DELETE -> 204 sin cuerpo, y despues ya no esta", async () => {
    const creado = await crearPartido({ rival: "Me voy a borrar" });

    const borrado = await request(app).delete(`/partidos/${creado.id}`);
    expect(borrado.status).toBe(204);
    expect(borrado.body).toEqual({});

    const despues = await request(app).get(`/partidos/${creado.id}`);
    expect(despues.status).toBe(404);
  });

  test("borrar dos veces el mismo -> la segunda da 404", async () => {
    const creado = await crearPartido();
    await request(app).delete(`/partidos/${creado.id}`);
    const otraVez = await request(app).delete(`/partidos/${creado.id}`);
    expect(otraVez.status).toBe(404);
  });

  test("DELETE de uno que no existe -> 404", async () => {
    const res = await request(app).delete("/partidos/999");
    expect(res.status).toBe(404);
  });

  test("borrar quita exactamente uno de la lista", async () => {
    const creado = await crearPartido();
    const antes = await cuantosHay();
    await request(app).delete(`/partidos/${creado.id}`);
    const despues = await cuantosHay();
    expect(despues).toBe(antes - 1);
  });
});

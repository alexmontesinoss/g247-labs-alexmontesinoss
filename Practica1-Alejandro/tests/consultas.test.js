/*
  tests/consultas.test.js
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Pruebas de la busqueda, los filtros, el orden, la paginacion y /stats.
  Van en un fichero aparte del CRUD para que se lean por separado.

  Jest arranca cada fichero de pruebas con sus propios modulos, asi que
  aqui el almacen vuelve a tener los 14 partidos de src/data/store.js
  aunque el otro fichero haya creado y borrado cosas.
*/

const request = require("supertest");
const app = require("../src/app");

describe("Buscar y filtrar", () => {
  test("sin parametros salen todos", async () => {
    const res = await request(app).get("/partidos");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(14);
  });

  test("search encuentra por un trozo del nombre del rival", async () => {
    const res = await request(app).get("/partidos?search=Algete");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].rival).toBe("Algete C.F.");
  });

  test("search no distingue mayusculas de minusculas", async () => {
    const res = await request(app).get("/partidos?search=algete");
    expect(res.body.length).toBe(1);
  });

  test("search que no encuentra nada -> lista vacia, no 404", async () => {
    const res = await request(app).get("/partidos?search=zzzzz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("filtrar por deporte", async () => {
    const res = await request(app).get("/partidos?deporte=tenis");
    expect(res.body.length).toBe(3);
    for (const partido of res.body) {
      expect(partido.deporte).toBe("tenis");
    }
  });

  test("filtrar por ganado=true", async () => {
    const res = await request(app).get("/partidos?ganado=true");
    for (const partido of res.body) {
      expect(partido.ganado).toBe(true);
    }
  });

  test("filtrar por ganado=false", async () => {
    const res = await request(app).get("/partidos?ganado=false");
    for (const partido of res.body) {
      expect(partido.ganado).toBe(false);
    }
  });

  test("los ganados y los perdidos suman el total", async () => {
    const ganados = await request(app).get("/partidos?ganado=true");
    const perdidos = await request(app).get("/partidos?ganado=false");
    expect(ganados.body.length + perdidos.body.length).toBe(14);
  });

  test("se pueden combinar varios filtros a la vez", async () => {
    const res = await request(app).get("/partidos?deporte=futbol&ganado=true");
    for (const partido of res.body) {
      expect(partido.deporte).toBe("futbol");
      expect(partido.ganado).toBe(true);
    }
  });

  test("un parametro que no existe se ignora, no da error", async () => {
    const res = await request(app).get("/partidos?inventado=42");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(14);
  });

  test("ganado con un valor raro se ignora", async () => {
    const res = await request(app).get("/partidos?ganado=quizas");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(14);
  });
});

describe("Ordenar", () => {
  test("sort=puntos ordena de menor a mayor", async () => {
    const res = await request(app).get("/partidos?sort=puntos");
    const puntos = res.body.map((p) => p.puntos);
    const ordenados = [...puntos].sort((a, b) => a - b);
    expect(puntos).toEqual(ordenados);
  });

  test("order=desc le da la vuelta", async () => {
    const res = await request(app).get("/partidos?sort=puntos&order=desc");
    const puntos = res.body.map((p) => p.puntos);
    const ordenados = [...puntos].sort((a, b) => b - a);
    expect(puntos).toEqual(ordenados);
  });

  test("tambien ordena por texto", async () => {
    const res = await request(app).get("/partidos?sort=rival");
    expect(res.body[0].rival.localeCompare(res.body[1].rival)).toBeLessThanOrEqual(0);
  });

  test("ordenar por un campo que no existe se ignora", async () => {
    const res = await request(app).get("/partidos?sort=inventado");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(14);
  });

  test("ordenar NO deja el almacen tocado para la siguiente peticion", async () => {
    const antes = await request(app).get("/partidos");
    const primeroAntes = antes.body[0].id;

    await request(app).get("/partidos?sort=puntos&order=desc");

    const despues = await request(app).get("/partidos");
    expect(despues.body[0].id).toBe(primeroAntes);
  });

  test("se puede filtrar y ordenar a la vez", async () => {
    const res = await request(app).get("/partidos?deporte=tenis&sort=puntos&order=desc");
    expect(res.body.length).toBe(3);
    expect(res.body[0].puntos).toBeGreaterThanOrEqual(res.body[1].puntos);
  });
});

describe("Paginar", () => {
  test("limit corta la lista", async () => {
    const res = await request(app).get("/partidos?limit=5");
    expect(res.body.length).toBe(5);
  });

  test("offset salta los primeros", async () => {
    const todos = await request(app).get("/partidos");
    const saltados = await request(app).get("/partidos?offset=3");
    expect(saltados.body.length).toBe(11);
    expect(saltados.body[0].id).toBe(todos.body[3].id);
  });

  test("limit y offset juntos dan una pagina del medio", async () => {
    const res = await request(app).get("/partidos?limit=4&offset=4");
    expect(res.body.length).toBe(4);
  });

  test("la cabecera X-Total-Count dice cuantos hay en total", async () => {
    const res = await request(app).get("/partidos?limit=3");
    expect(res.body.length).toBe(3);
    expect(res.headers["x-total-count"]).toBe("14");
  });

  test("X-Total-Count cuenta los filtrados, no todos", async () => {
    const res = await request(app).get("/partidos?deporte=tenis&limit=1");
    expect(res.body.length).toBe(1);
    expect(res.headers["x-total-count"]).toBe("3");
  });

  test("un limit que no es un numero se ignora", async () => {
    const res = await request(app).get("/partidos?limit=abc");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(14);
  });

  test("un offset mas alla del final -> lista vacia, no error", async () => {
    const res = await request(app).get("/partidos?offset=999");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("filtrar, ordenar y paginar a la vez", async () => {
    const res = await request(app).get(
      "/partidos?deporte=futbol&sort=puntos&order=desc&limit=2"
    );
    expect(res.body.length).toBe(2);
    expect(res.body[0].deporte).toBe("futbol");
    expect(res.body[0].puntos).toBeGreaterThanOrEqual(res.body[1].puntos);
  });
});

describe("Estadisticas", () => {
  test("GET /partidos/stats -> 200", async () => {
    const res = await request(app).get("/partidos/stats");
    expect(res.status).toBe(200);
  });

  test("la ruta /stats NO se confunde con /:id", async () => {
    const res = await request(app).get("/partidos/stats");
    // Si /:id ganara, "stats" se leeria como un id y saldria un 404.
    expect(res.status).not.toBe(404);
    expect(res.body).toHaveProperty("total");
  });

  test("cuenta bien el total y los ganados", async () => {
    const stats = await request(app).get("/partidos/stats");
    const ganados = await request(app).get("/partidos?ganado=true");

    expect(stats.body.total).toBe(14);
    expect(stats.body.ganados).toBe(ganados.body.length);
    expect(stats.body.ganados + stats.body.perdidos).toBe(stats.body.total);
  });

  test("desglosa por deporte", async () => {
    const res = await request(app).get("/partidos/stats");
    expect(res.body.porDeporte.futbol).toBe(6);
    expect(res.body.porDeporte.tenis).toBe(3);
    expect(res.body.porDeporte.baloncesto).toBe(3);
    expect(res.body.porDeporte.padel).toBe(2);
  });

  test("las estadisticas tambien hacen caso a los filtros", async () => {
    const res = await request(app).get("/partidos/stats?deporte=tenis");
    expect(res.body.total).toBe(3);
  });

  test("el porcentaje de victorias cuadra", async () => {
    const res = await request(app).get("/partidos/stats");
    const esperado = Math.round((res.body.ganados / res.body.total) * 100);
    expect(res.body.porcentajeVictorias).toBe(esperado);
  });
});

describe("El JSON mal escrito ahora contesta en condiciones", () => {
  test("devuelve 400 con la misma forma que el resto de errores", async () => {
    const res = await request(app)
      .post("/partidos")
      .set("Content-Type", "application/json")
      .send('{"rival":"roto"');

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors[0].field).toBe("body");
  });
});

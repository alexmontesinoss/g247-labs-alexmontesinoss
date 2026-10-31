/*
  tests/agente.test.js
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Estas pruebas salen de los fallos que encontro el tester agent de caja
  negra (apartado 9). Cada bloque lleva el identificador del hallazgo tal
  y como aparece en AI/review-log.md.

  Antes de arreglar nada, cada una de estas pruebas fallaba. Estan aqui
  para que ninguno de esos fallos pueda volver sin que nos enteremos.
*/

const request = require("supertest");
const app = require("../src/app");

const BASE = {
  rival: "Test FC",
  puntos: 3,
  ganado: true,
  deporte: "futbol",
  temporada: "2024-25",
};

describe("D2 · el rival se guarda recortado, no solo se valida recortado", () => {
  test("POST: los espacios de los extremos no se almacenan", async () => {
    const res = await request(app)
      .post("/partidos")
      .send({ ...BASE, rival: "  AB  " });

    expect(res.status).toBe(201);
    expect(res.body.rival).toBe("AB");
  });

  test("POST: 80 caracteres con espacios alrededor no pasan de 80 al guardarse", async () => {
    const ochenta = "y".repeat(80);
    const res = await request(app)
      .post("/partidos")
      .send({ ...BASE, rival: "  " + ochenta + "  " });

    expect(res.status).toBe(201);
    expect(res.body.rival.length).toBe(80);
  });

  test("PATCH: tambien recorta", async () => {
    const creado = await request(app).post("/partidos").send(BASE);
    const res = await request(app)
      .patch(`/partidos/${creado.body.id}`)
      .send({ rival: "   Con Espacios   " });

    expect(res.status).toBe(200);
    expect(res.body.rival).toBe("Con Espacios");
  });

  test("PUT: tambien recorta", async () => {
    const creado = await request(app).post("/partidos").send(BASE);
    const res = await request(app)
      .put(`/partidos/${creado.body.id}`)
      .send({ ...BASE, rival: "  Puesto Con PUT  " });

    expect(res.status).toBe(200);
    expect(res.body.rival).toBe("Puesto Con PUT");
  });

  test("la temporada tambien se recorta", async () => {
    const res = await request(app)
      .post("/partidos")
      .send({ ...BASE, temporada: "  2020-21  " });

    expect(res.status).toBe(201);
    expect(res.body.temporada).toBe("2020-21");
  });
});

describe("D4 · la longitud del rival se mide en caracteres, no en unidades UTF-16", () => {
  const PELOTA = "\u{1F3C0}"; // un emoji = 1 caracter, pero 2 unidades UTF-16

  test("un solo emoji es 1 caracter y el minimo son 2 -> 400", async () => {
    const res = await request(app)
      .post("/partidos")
      .send({ ...BASE, rival: PELOTA });

    expect(res.status).toBe(400);
  });

  test("41 emojis son 41 caracteres y el maximo son 80 -> se acepta", async () => {
    const res = await request(app)
      .post("/partidos")
      .send({ ...BASE, rival: PELOTA.repeat(41) });

    expect(res.status).toBe(201);
  });

  test("81 caracteres normales siguen rechazandose", async () => {
    const res = await request(app)
      .post("/partidos")
      .send({ ...BASE, rival: "y".repeat(81) });

    expect(res.status).toBe(400);
  });
});

describe("D5 · el id de la ruta tiene que ser solo digitos", () => {
  test("/partidos/1e1 no puede devolver el partido 10", async () => {
    const res = await request(app).get("/partidos/1e1");
    expect(res.status).toBe(404);
  });

  // "03" SI vale: son todo digitos y es el numero 3 escrito con un cero
  // delante. Lo que no vale es "1e1", que no es un numero escrito en
  // decimal sino notacion cientifica.
  test("/partidos/03 si devuelve el partido 3", async () => {
    const res = await request(app).get("/partidos/03");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(3);
  });

  test("un DELETE con un id raro no borra a otro", async () => {
    const antes = await request(app).get("/partidos/10");
    expect(antes.status).toBe(200);

    const borrado = await request(app).delete("/partidos/1e1");
    expect(borrado.status).toBe(404);

    // El 10 tiene que seguir donde estaba.
    const despues = await request(app).get("/partidos/10");
    expect(despues.status).toBe(200);
  });

  test("PUT y PATCH con un id raro tampoco tocan nada", async () => {
    const put = await request(app).put("/partidos/1e1").send(BASE);
    expect(put.status).toBe(404);

    const patch = await request(app).patch("/partidos/1e1").send({ puntos: 1 });
    expect(patch.status).toBe(404);
  });

  test("los ids normales siguen funcionando", async () => {
    const res = await request(app).get("/partidos/3");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(3);
  });
});

describe("D3 · un parametro repetido usa el primer valor, no desactiva el filtro", () => {
  test("deporte repetido sigue filtrando", async () => {
    const uno = await request(app).get("/partidos?deporte=tenis");
    const dos = await request(app).get("/partidos?deporte=tenis&deporte=padel");

    expect(dos.status).toBe(200);
    // Lo importante: NO devuelve la coleccion entera.
    expect(dos.body.length).toBe(uno.body.length);
    for (const partido of dos.body) {
      expect(partido.deporte).toBe("tenis");
    }
  });

  test("ganado repetido sigue filtrando", async () => {
    const res = await request(app).get("/partidos?ganado=true&ganado=false");
    expect(res.status).toBe(200);
    for (const partido of res.body) {
      expect(partido.ganado).toBe(true);
    }
  });

  test("limit repetido sigue limitando", async () => {
    const res = await request(app).get("/partidos?limit=2&limit=5");
    expect(res.body.length).toBe(2);
  });

  test("sort repetido sigue ordenando", async () => {
    const res = await request(app).get("/partidos?sort=puntos&sort=rival&order=desc");
    const puntos = res.body.map((p) => p.puntos);
    const ordenados = [...puntos].sort((a, b) => b - a);
    expect(puntos).toEqual(ordenados);
  });
});

// Este bloque va el ULTIMO a proposito: crea mas de 100 partidos y deja
// el almacen lleno, asi que cualquier prueba posterior contaria mal.
describe("D1 · sin limit no se corta la lista en 100", () => {
  test("con mas de 100 partidos, GET /partidos los devuelve todos", async () => {
    const inicial = await request(app).get("/partidos");
    const faltan = 105 - inicial.body.length;

    for (let i = 0; i < faltan; i++) {
      await request(app)
        .post("/partidos")
        .send({ ...BASE, rival: "Relleno " + i });
    }

    const res = await request(app).get("/partidos");

    expect(res.body.length).toBeGreaterThan(100);
    expect(res.headers["x-total-count"]).toBe(String(res.body.length));
  });

  test("pero un limit explicito sigue topado en 100", async () => {
    const res = await request(app).get("/partidos?limit=500");
    expect(res.body.length).toBe(100);
  });
});

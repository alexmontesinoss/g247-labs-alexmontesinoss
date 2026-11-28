/*
  tests/partidos.test.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  La parte de LECTURA: listado, paginacion, busqueda, filtros, orden,
  estadisticas y el resumen agrupado. Nada de esto cambia la base de datos,
  asi que todas estas pruebas pueden convivir sin pisarse.

  Datos de partida (db/seed.sql): 28 partidos y 3 usuarios.
*/

const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");

const { app, db, request, reiniciarBaseDeDatos, entrar, conToken } = require("./helpers");

const TOTAL = 28;

before(() => reiniciarBaseDeDatos());
after(() => db.end());

describe("GET /health y rutas que no existen", () => {
  test("/health contesta ok", async () => {
    const res = await request(app).get("/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });

  test("una ruta inventada da 404 en JSON, no la pagina de Express", async () => {
    const res = await request(app).get("/esto-no-existe");
    assert.equal(res.status, 404);
    assert.equal(typeof res.body.error, "string");
  });
});

describe("GET /partidos — el contrato del listado", () => {
  test("devuelve { page, limit, total, items }", async () => {
    const res = await request(app).get("/partidos");

    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body).sort(), ["items", "limit", "page", "total"]);
    assert.equal(res.body.page, 1);
    assert.equal(res.body.limit, 20);
    assert.equal(res.body.total, TOTAL);
    assert.equal(res.body.items.length, 20); // el total es 28, la pagina 20
  });

  test("los partidos salen en camelCase y sin los nombres de las columnas", async () => {
    const res = await request(app).get("/partidos?limit=1");
    const partido = res.body.items[0];

    assert.equal(typeof partido.userId, "number");
    assert.equal(partido.user_id, undefined, "se esta escapando el nombre de la columna");
    assert.equal(partido.created_at, undefined);
    assert.ok("createdAt" in partido);
    assert.ok("ownerEmail" in partido);
  });

  test("ningun partido lleva datos del usuario que no toquen", async () => {
    const res = await request(app).get("/partidos?limit=100");
    const texto = JSON.stringify(res.body);

    assert.ok(!texto.includes("password"));
    assert.ok(!texto.includes("$2b$"));
  });
});

describe("paginacion", () => {
  test("la pagina 2 trae filas distintas de la 1", async () => {
    const uno = await request(app).get("/partidos?page=1&limit=5");
    const dos = await request(app).get("/partidos?page=2&limit=5");

    const idsUno = uno.body.items.map((p) => p.id);
    const idsDos = dos.body.items.map((p) => p.id);

    assert.equal(idsUno.length, 5);
    assert.equal(idsDos.length, 5);
    // Ni una sola repetida entre las dos paginas.
    assert.equal(idsUno.filter((id) => idsDos.includes(id)).length, 0);
  });

  test("el total NO cambia al pasar de pagina (se cuenta sin LIMIT)", async () => {
    const uno = await request(app).get("/partidos?page=1&limit=5");
    const seis = await request(app).get("/partidos?page=6&limit=5");

    assert.equal(uno.body.total, TOTAL);
    assert.equal(seis.body.total, TOTAL);
  });

  test("recorriendo todas las paginas salen los 28 sin repetir", async () => {
    const vistos = new Set();
    for (let page = 1; page <= 6; page++) {
      const res = await request(app).get(`/partidos?page=${page}&limit=5`);
      for (const p of res.body.items) vistos.add(p.id);
    }
    assert.equal(vistos.size, TOTAL);
  });

  test("una pagina pasada de largo devuelve lista vacia, no error", async () => {
    const res = await request(app).get("/partidos?page=999&limit=5");

    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 0);
    assert.equal(res.body.total, TOTAL); // el total sigue siendo el que es
  });

  test("un limit enorme se recorta a 100", async () => {
    const res = await request(app).get("/partidos?limit=999999");
    assert.equal(res.body.limit, 100);
  });

  test("page y limit con basura: valores por defecto, no NaN", async () => {
    const res = await request(app).get("/partidos?page=hola&limit=abc");

    assert.equal(res.body.page, 1);
    assert.equal(res.body.limit, 20);
  });

  test("page=0 y page=-3 se suben a 1", async () => {
    assert.equal((await request(app).get("/partidos?page=0")).body.page, 1);
    assert.equal((await request(app).get("/partidos?page=-3")).body.page, 1);
  });
});

describe("busqueda y filtros (los hace SQL, no JavaScript)", () => {
  test("search encuentra sin distinguir mayusculas (ILIKE)", async () => {
    const res = await request(app).get("/partidos?search=MARIN");

    assert.ok(res.body.total >= 1, "no ha encontrado nada");
    assert.ok(res.body.items.every((p) => /marin/i.test(p.rival)));
  });

  test("search busca dentro del nombre, no solo al principio", async () => {
    const res = await request(app).get("/partidos?search=c");
    assert.ok(res.body.total > 1);
  });

  test("search sin resultados: total 0 y lista vacia", async () => {
    const res = await request(app).get("/partidos?search=zzzzzznoexiste");

    assert.equal(res.status, 200);
    assert.equal(res.body.total, 0);
    assert.equal(res.body.items.length, 0);
  });

  test("filtro por deporte", async () => {
    const res = await request(app).get("/partidos?deporte=tenis&limit=100");

    assert.ok(res.body.total > 0);
    assert.ok(res.body.items.every((p) => p.deporte === "tenis"));
    assert.ok(res.body.total < TOTAL, "no ha filtrado nada");
  });

  test("filtro ganado=false trae solo los perdidos", async () => {
    const res = await request(app).get("/partidos?ganado=false&limit=100");

    assert.ok(res.body.total > 0);
    assert.ok(res.body.items.every((p) => p.ganado === false));
  });

  test("dos filtros a la vez se suman con AND", async () => {
    const soloTenis = await request(app).get("/partidos?deporte=tenis&limit=100");
    const tenisGanado = await request(app).get("/partidos?deporte=tenis&ganado=true&limit=100");

    assert.ok(tenisGanado.body.total <= soloTenis.body.total);
    assert.ok(tenisGanado.body.items.every((p) => p.deporte === "tenis" && p.ganado === true));
  });

  test("el total respeta el filtro: se cuenta despues de filtrar", async () => {
    const res = await request(app).get("/partidos?deporte=padel&limit=2");

    assert.ok(res.body.total < TOTAL);
    assert.equal(res.body.items.length, Math.min(2, res.body.total));
  });

  test("un filtro vacio no filtra nada", async () => {
    const res = await request(app).get("/partidos?deporte=&search=");
    assert.equal(res.body.total, TOTAL);
  });
});

describe("ordenacion y su lista blanca", () => {
  test("sort=puntos&order=desc ordena de mas a menos", async () => {
    const res = await request(app).get("/partidos?sort=puntos&order=desc&limit=100");
    const puntos = res.body.items.map((p) => p.puntos);

    for (let i = 1; i < puntos.length; i++) {
      assert.ok(puntos[i - 1] >= puntos[i], `roto en la posicion ${i}: ${puntos}`);
    }
  });

  test("sort=rival&order=asc ordena alfabeticamente", async () => {
    const res = await request(app).get("/partidos?sort=rival&order=asc&limit=100");
    const rivales = res.body.items.map((p) => p.rival);
    const copiaOrdenada = [...rivales].sort((a, b) => a.localeCompare(b, "es"));

    assert.deepEqual(rivales, copiaOrdenada);
  });

  test("una columna que no esta en la lista blanca se ignora y se ordena por id", async () => {
    const inventado = await request(app).get("/partidos?sort=columna_inventada&limit=5");
    const porDefecto = await request(app).get("/partidos?limit=5");

    assert.equal(inventado.status, 200);
    assert.deepEqual(
      inventado.body.items.map((p) => p.id),
      porDefecto.body.items.map((p) => p.id)
    );
  });

  test("INYECCION SQL por el parametro de orden: se ignora y la tabla sigue viva", async () => {
    const ataque = "; DROP TABLE partidos; --";
    const res = await request(app).get("/partidos?sort=" + encodeURIComponent(ataque));

    assert.equal(res.status, 200);

    // Y lo que de verdad importa: la tabla sigue ahi con sus 28 filas.
    const { rows } = await db.query("SELECT COUNT(*)::int AS c FROM partidos");
    assert.equal(rows[0].c, TOTAL);
  });

  test("INYECCION SQL por la busqueda: se trata como texto, no como condicion", async () => {
    const res = await request(app).get("/partidos?search=" + encodeURIComponent("' OR 1=1 --"));

    assert.equal(res.status, 200);
    // Si se hubiera ejecutado como condicion, saldrian los 28.
    assert.equal(res.body.total, 0);
  });

  test("las paginas no se solapan aunque se ordene por un campo repetido", async () => {
    // deporte se repite mucho; sin el desempate por id, PostgreSQL no
    // promete el orden y dos paginas podrian repetir filas.
    const uno = await request(app).get("/partidos?sort=deporte&limit=10&page=1");
    const dos = await request(app).get("/partidos?sort=deporte&limit=10&page=2");

    const idsUno = uno.body.items.map((p) => p.id);
    const idsDos = dos.body.items.map((p) => p.id);
    assert.equal(idsUno.filter((id) => idsDos.includes(id)).length, 0);
  });
});

describe("GET /partidos/:id", () => {
  test("un id que existe devuelve ese partido", async () => {
    const res = await request(app).get("/partidos/1");

    assert.equal(res.status, 200);
    assert.equal(res.body.id, 1);
  });

  test("un id que no existe: 404", async () => {
    const res = await request(app).get("/partidos/99999");
    assert.equal(res.status, 404);
  });

  test("/partidos/1e1 NO es el partido 10", async () => {
    // Number("1e1") vale 10. Si se convirtiera a lo bruto, esta URL
    // devolveria el partido 10 y dos direcciones distintas darian el mismo
    // recurso.
    const res = await request(app).get("/partidos/1e1");
    assert.equal(res.status, 404);
  });

  test("/partidos/abc da 404, no un 500", async () => {
    const res = await request(app).get("/partidos/abc");
    assert.equal(res.status, 404);
  });
});

describe("GET /partidos/stats", () => {
  test("va antes que /:id y devuelve las cifras globales", async () => {
    const res = await request(app).get("/partidos/stats");

    assert.equal(res.status, 200);
    assert.equal(res.body.total, TOTAL);
    assert.equal(res.body.ganados + res.body.perdidos, TOTAL);
    assert.ok(res.body.porcentaje_victorias >= 0 && res.body.porcentaje_victorias <= 100);
  });

  test("acepta los mismos filtros que el listado", async () => {
    const listado = await request(app).get("/partidos?deporte=tenis&limit=100");
    const stats = await request(app).get("/partidos/stats?deporte=tenis");

    assert.equal(stats.body.total, listado.body.total);
  });

  test("con ?mias=true y token, solo cuenta los tuyos", async () => {
    const { token } = await entrar("lucia");

    const mias = await conToken(request(app).get("/partidos/stats?mias=true"), token);
    const suyos = await conToken(request(app).get("/partidos/mios?limit=100"), token);

    assert.equal(mias.body.total, suyos.body.total);
    assert.ok(mias.body.total < TOTAL, "no ha filtrado por usuario");
  });

  test("un filtro sin resultados no revienta con una division por cero", async () => {
    const res = await request(app).get("/partidos/stats?search=zzzzznoexiste");

    assert.equal(res.status, 200);
    assert.equal(res.body.total, 0);
    assert.equal(res.body.porcentaje_victorias, 0);
    assert.equal(res.body.puntos_por_partido, 0);
  });
});

describe("GET /partidos/resumen — la consulta agregada propia", () => {
  test("agrupa por deporte y las cuentas cuadran con el total", async () => {
    const res = await request(app).get("/partidos/resumen");

    assert.equal(res.status, 200);
    assert.ok(res.body.items.length > 1);

    const suma = res.body.items.reduce((acc, fila) => acc + fila.partidos, 0);
    assert.equal(suma, TOTAL);
  });

  test("cada grupo trae sus cifras y viene ordenado de mas jugado a menos", async () => {
    const res = await request(app).get("/partidos/resumen");

    for (const fila of res.body.items) {
      assert.ok(fila.ganados <= fila.partidos);
      assert.ok(fila.porcentaje_victorias >= 0 && fila.porcentaje_victorias <= 100);
      assert.equal(typeof fila.mejor_marca, "number");
    }

    const cantidades = res.body.items.map((f) => f.partidos);
    for (let i = 1; i < cantidades.length; i++) {
      assert.ok(cantidades[i - 1] >= cantidades[i]);
    }
  });
});

describe("GET /partidos/mios", () => {
  test("sin token: 401", async () => {
    const res = await request(app).get("/partidos/mios");
    assert.equal(res.status, 401);
  });

  test("con token: solo los del que ha entrado", async () => {
    const { token, user } = await entrar("lucia");
    const res = await conToken(request(app).get("/partidos/mios?limit=100"), token);

    assert.equal(res.status, 200);
    assert.ok(res.body.total > 0);
    assert.ok(res.body.items.every((p) => p.userId === user.id));
    assert.ok(res.body.total < TOTAL);
  });

  test("dos usuarios distintos ven listas distintas", async () => {
    const alex = await entrar("alex");
    const lucia = await entrar("lucia");

    const deAlex = await conToken(request(app).get("/partidos/mios?limit=100"), alex.token);
    const deLucia = await conToken(request(app).get("/partidos/mios?limit=100"), lucia.token);

    const idsAlex = deAlex.body.items.map((p) => p.id);
    const idsLucia = deLucia.body.items.map((p) => p.id);

    assert.equal(idsAlex.filter((id) => idsLucia.includes(id)).length, 0);
  });

  test("tambien pagina y filtra", async () => {
    const { token } = await entrar("alex");
    const res = await conToken(request(app).get("/partidos/mios?limit=2&deporte=futbol"), token);

    assert.ok(res.body.items.length <= 2);
    assert.ok(res.body.items.every((p) => p.deporte === "futbol"));
  });
});

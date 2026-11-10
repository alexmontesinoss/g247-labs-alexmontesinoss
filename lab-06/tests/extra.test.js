/*
  tests/extra.test.js

  Pruebas mias, ademas de las del profesor. Las suyas estan en
  tasksModel.test.js y no las he tocado: estas van aparte para que se vea
  cuales son de cada uno.

  Cada una comprueba algo que me podria salir mal sin que las otras se
  enterasen.
*/

const test = require("node:test");
const assert = require("node:assert/strict");
const { createTasksModel } = require("../src/models/tasksModel");
const { createFakeDb } = require("./helpers/fakeDb");

function setup() {
  const db = createFakeDb();
  return { db, model: createTasksModel(db) };
}

// La trampa del ?? frente al ||. La tarea 2 esta hecha (done: true) y le mando
// SOLO done: false. Tienen que pasar dos cosas: que se quede en false, y que
// el titulo no se toque. Si en el modelo hubiera puesto "|| null", el false se
// perderia por el camino y la tarea seguiria marcada como hecha.
test("update acepta done: false sin tocar los demas campos", async () => {
  const { model } = setup();
  const antes = await model.findById(2);
  assert.equal(antes.done, true);

  const despues = await model.update(2, { done: false });
  assert.equal(despues.done, false);
  assert.equal(despues.title, antes.title);
  assert.equal(despues.user_id, antes.user_id);
});

// findByOwner tiene que poder llamarse sin el segundo argumento: entonces usa
// limit 10 y offset 0. El usuario 1 tiene 4 tareas, asi que salen las 4.
test("findByOwner funciona sin pasarle opciones", async () => {
  const { model } = setup();
  const tareas = await model.findByOwner(1);
  assert.deepEqual(tareas.map((t) => t.id), [1, 2, 3, 4]);
});

// Que no se cuele ninguna tarea de otro usuario en el listado.
test("findByOwner solo devuelve tareas de ese usuario", async () => {
  const { model } = setup();
  const tareas = await model.findByOwner(2, { limit: 50, offset: 0 });
  assert.equal(tareas.length, 2);
  assert.equal(tareas.every((t) => t.user_id === 2), true);
});

// create con done: true explicito. El valor por defecto ya lo prueba el
// profesor; esto comprueba que cuando SI lo mando, llega.
test("create respeta done cuando se lo mando", async () => {
  const { model } = setup();
  const creada = await model.create({ title: "Repasar JOINs", userId: 3, done: true });
  assert.equal(creada.done, true);
  assert.equal(creada.user_id, 3);
});

// El ORDER BY no es decorativo: es lo que hace que las paginas sean estables.
// Compruebo que de verdad viaja dentro del SQL, no que el resultado salga
// ordenado por casualidad.
test("findAll y findByOwner mandan ORDER BY en el SQL", async () => {
  const { db, model } = setup();

  await model.findAll();
  assert.match(db.calls.at(-1).text, /ORDER BY id/);

  await model.findByOwner(1, { limit: 2, offset: 0 });
  assert.match(db.calls.at(-1).text, /ORDER BY id/);
});

// Lo mismo que el test de inyeccion del profesor pero en el borrado, que es
// la operacion donde una inyeccion hace mas dano: un "1 OR 1=1" concatenado
// vaciaria la tabla entera.
test("remove tambien manda el id como parametro", async () => {
  const { db, model } = setup();
  const ataque = "1 OR 1=1";

  await model.remove(ataque);

  const llamada = db.calls.at(-1);
  assert.match(llamada.text, /WHERE id = \$1/);
  assert.equal(llamada.text.includes(ataque), false);
  assert.deepEqual(llamada.params, [ataque]);
});

/*
  src/controllers/partidosController.js
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Un controlador por operacion. Ninguno toca el array: todos piden las
  cosas al almacen (src/data/store.js), que es el unico que lo conoce.
*/

const store = require("../data/store");
const { validatePartido } = require("../validators/partidoValidator");
const {
  filtrar,
  ordenar,
  paginar,
  calcularStats,
} = require("../utils/consultas");

// Los unicos campos que el cliente puede enviar. El id NO esta en la lista:
// lo genera el servidor y, si el cliente lo manda, se ignora.
const CAMPOS = ["rival", "puntos", "ganado", "deporte", "temporada"];

/*
  El :id de la URL llega SIEMPRE como texto. Number() es demasiado
  generoso: convierte "1e1" en 10 y "03" en 3, asi que /partidos/1e1
  devolvia el partido 10 y un DELETE podia borrar el que no era.
  Aqui exigimos que sean solo digitos antes de convertir.
*/
function idDeRuta(texto) {
  const digitos = "0123456789";

  if (typeof texto !== "string" || texto.length === 0) {
    return null;
  }
  for (let i = 0; i < texto.length; i++) {
    if (!digitos.includes(texto[i])) {
      return null;
    }
  }

  return Number(texto);
}

// El validador mide el rival sin los espacios de los extremos, asi que
// lo guardamos igual de recortado. Si no, un rival de 80 caracteres con
// espacios alrededor se almacenaba con 84 y se saltaba el maximo.
function limpiarTexto(valor) {
  return typeof valor === "string" ? valor.trim() : valor;
}

// Para POST y PUT: el recurso ENTERO. Lo que el cliente no envie queda a
// undefined (o a null en temporada), no se hereda de lo que hubiera antes.
function cuerpoCompleto(body) {
  const datos = body || {};
  return {
    rival: limpiarTexto(datos.rival),
    puntos: datos.puntos,
    ganado: datos.ganado,
    deporte: datos.deporte,
    temporada: datos.temporada === undefined ? null : limpiarTexto(datos.temporada),
  };
}

// Para PATCH: solo los campos que vienen de verdad en la peticion.
// Los que no aparecen no se tocan, y los desconocidos se descartan aqui.
function cuerpoParcial(body) {
  const datos = body || {};
  const cambios = {};
  for (const campo of CAMPOS) {
    if (datos[campo] !== undefined) {
      cambios[campo] = limpiarTexto(datos[campo]);
    }
  }
  return cambios;
}

function noEncontrado(res) {
  return res.status(404).json({ error: "Partido no encontrado" });
}

// El 400 devuelve SIEMPRE la lista completa de fallos, no el primero,
// para que el cliente pueda pintar cada uno debajo de su campo.
function datosInvalidos(res, errors) {
  return res.status(400).json({ errors });
}

// GET /partidos
// Admite ?search= &deporte= &ganado= &temporada= &sort= &order= &limit= &offset=
// Se pueden combinar todos. Los parametros que no reconocemos se ignoran.
function listPartidos(req, res) {
  const todos = store.findAll();

  // El orden importa: primero se filtra, luego se ordena lo que ha
  // quedado, y solo al final se corta la pagina.
  const filtrados = filtrar(todos, req.query);
  const ordenados = ordenar(filtrados, req.query);
  const pagina = paginar(ordenados, req.query);

  // Cuantos hay EN TOTAL una vez filtrado, antes de cortar la pagina.
  // Va en una cabecera para que el cuerpo siga siendo una lista limpia.
  res.set("X-Total-Count", String(filtrados.length));

  res.status(200).json(pagina);
}

// GET /partidos/stats
// Resumen de todos los partidos. Los filtros tambien valen aqui.
function getStats(req, res) {
  const filtrados = filtrar(store.findAll(), req.query);
  res.status(200).json(calcularStats(filtrados));
}

// GET /partidos/:id
function getPartido(req, res) {
  // Un id que no sea numero se convierte en NaN, no encuentra nada y cae
  // en el 404. El servidor no se rompe.
  const partido = store.findById(idDeRuta(req.params.id));

  if (!partido) {
    return noEncontrado(res);
  }

  res.status(200).json(partido);
}

// POST /partidos
function createPartido(req, res) {
  // Validar ANTES de tocar el almacen: si falla, no se crea nada.
  const { valid, errors } = validatePartido(req.body);

  if (!valid) {
    return datosInvalidos(res, errors);
  }

  const nuevo = store.insert(cuerpoCompleto(req.body));

  // 201 Created + Location, que indica donde ha quedado el recurso nuevo.
  res.status(201).location(`/partidos/${nuevo.id}`).json(nuevo);
}

// PUT /partidos/:id — sustituye el recurso entero
function replacePartido(req, res) {
  const id = idDeRuta(req.params.id);

  // Primero el 404: si el partido no existe, da igual lo que mande el cliente.
  if (!store.findById(id)) {
    return noEncontrado(res);
  }

  // PUT sustituye entero, asi que exige el recurso completo.
  const { valid, errors } = validatePartido(req.body);

  if (!valid) {
    return datosInvalidos(res, errors);
  }

  const sustituido = store.replace(id, cuerpoCompleto(req.body));

  res.status(200).json(sustituido);
}

// PATCH /partidos/:id — cambia solo lo que llega
function patchPartido(req, res) {
  const id = idDeRuta(req.params.id);

  if (!store.findById(id)) {
    return noEncontrado(res);
  }

  const cambios = cuerpoParcial(req.body);

  // Un PATCH sin ningun campo conocido no tiene sentido.
  if (Object.keys(cambios).length === 0) {
    return datosInvalidos(res, [
      { field: "body", message: "Hay que enviar al menos un campo que modificar." },
    ]);
  }

  // partial: true -> solo se revisan los campos que han llegado.
  const { valid, errors } = validatePartido(cambios, { partial: true });

  if (!valid) {
    return datosInvalidos(res, errors);
  }

  const actualizado = store.update(id, cambios);

  res.status(200).json(actualizado);
}

// DELETE /partidos/:id
function deletePartido(req, res) {
  const borrado = store.remove(idDeRuta(req.params.id));

  if (!borrado) {
    return noEncontrado(res);
  }

  // 204 No Content: ha ido bien y no hay nada que devolver.
  res.status(204).end();
}

module.exports = {
  listPartidos,
  getStats,
  getPartido,
  createPartido,
  replacePartido,
  patchPartido,
  deletePartido,
};

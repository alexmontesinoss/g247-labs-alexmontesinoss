/*
  src/data/store.js — almacen en memoria
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Este es el UNICO fichero que toca el array. El controlador nunca lo ve:
  le pide cosas a traves de estas funciones. Asi, el dia que esto sea una
  base de datos, solo cambia este fichero y el resto sigue igual.
*/

// Mis partidos. El array es mutable: crear, editar y borrar lo cambian.
let partidos = [
  { id: 1,  rival: "Algete C.F.",            puntos: 2,  ganado: true,  deporte: "futbol",     temporada: "2015-16" },
  { id: 2,  rival: "Ajalvir C.D.",           puntos: 0,  ganado: false, deporte: "futbol",     temporada: "2016-17" },
  { id: 3,  rival: "Daganzo C.F.",           puntos: 3,  ganado: true,  deporte: "futbol",     temporada: "2017-18" },
  { id: 4,  rival: "Cobena C.D.",            puntos: 1,  ganado: false, deporte: "futbol",     temporada: "2018-19" },
  { id: 5,  rival: "Fuente el Saz C.F.",     puntos: 4,  ganado: true,  deporte: "futbol",     temporada: "2019-20" },
  { id: 6,  rival: "Valdeolmos C.D.",        puntos: 1,  ganado: true,  deporte: "futbol",     temporada: "2021-22" },
  { id: 7,  rival: "Hugo Serrano",           puntos: 12, ganado: false, deporte: "tenis",      temporada: "2022-23" },
  { id: 8,  rival: "Pablo Marin",            puntos: 18, ganado: true,  deporte: "tenis",      temporada: "2023-24" },
  { id: 9,  rival: "Diego Ferrer",           puntos: 15, ganado: false, deporte: "tenis",      temporada: "2023-24" },
  { id: 10, rival: "Annandale High School",  puntos: 41, ganado: false, deporte: "baloncesto", temporada: "2024-25" },
  { id: 11, rival: "Dassel-Cokato",          puntos: 56, ganado: true,  deporte: "baloncesto", temporada: "2024-25" },
  { id: 12, rival: "Litchfield",             puntos: 38, ganado: false, deporte: "baloncesto", temporada: "2024-25" },
  { id: 13, rival: "Javi y Marcos",          puntos: 11, ganado: true,  deporte: "padel",      temporada: "2025-26" },
  { id: 14, rival: "Nico y Alvaro",          puntos: 8,  ganado: false, deporte: "padel",      temporada: "2026-27" },
];

// El id que recibira el proximo partido creado.
let nextId = 15;

// Devuelve todos los partidos. El filtrado y la ordenacion los hace el
// controlador: este modulo solo guarda y entrega.
function findAll() {
  return partidos;
}

// Busca uno por id. Devuelve undefined si no existe.
function findById(id) {
  return partidos.find((p) => p.id === id);
}

// Crea un partido nuevo. El id lo pone el servidor, nunca el cliente.
function insert(datos) {
  const partido = { id: nextId++, ...datos };
  partidos.push(partido);
  return partido;
}

// Sustituye el partido entero conservando el id (es lo que hace PUT).
// Devuelve el nuevo, o null si ese id no existe.
function replace(id, datos) {
  const i = partidos.findIndex((p) => p.id === id);
  if (i === -1) {
    return null;
  }
  partidos[i] = { id, ...datos };
  return partidos[i];
}

// Cambia solo los campos recibidos y deja el resto como estaba (PATCH).
function update(id, cambios) {
  const i = partidos.findIndex((p) => p.id === id);
  if (i === -1) {
    return null;
  }
  partidos[i] = { ...partidos[i], ...cambios, id };
  return partidos[i];
}

// Borra uno. Devuelve true si lo encontro y false si no.
function remove(id) {
  const i = partidos.findIndex((p) => p.id === id);
  if (i === -1) {
    return false;
  }
  partidos.splice(i, 1);
  return true;
}

module.exports = { findAll, findById, insert, replace, update, remove };

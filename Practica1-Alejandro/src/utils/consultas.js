/*
  src/utils/consultas.js
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Busqueda, filtros, orden y paginacion. Todo esto pasa EN EL SERVIDOR:
  el cliente pide "/partidos?deporte=tenis&limit=5" y recibe solo esos 5.
  Si lo hiciera el navegador, el servidor tendria que mandarle la lista
  entera cada vez y el filtrado dependeria del ordenador del usuario.

  Regla de los parametros raros: los que no reconocemos SE IGNORAN.
  "?inventado=42" no es un error, simplemente no hace nada.

  Ninguna funcion de aqui modifica la lista original: todas trabajan
  sobre una copia. Eso importa sobre todo en ordenar(), porque el .sort()
  de JavaScript cambia el array sobre el que se llama.
*/

// Campos por los que se puede ordenar. Cualquier otro se ignora.
const CAMPOS_ORDENABLES = ["id", "rival", "puntos", "deporte", "temporada"];

// Tope de seguridad: aunque pidan limit=99999, no mandamos mas de esto.
const LIMITE_MAXIMO = 100;

// Convierte el texto de la URL en numero entero, o devuelve null si no
// se puede. Ojo: en una URL TODO llega como texto, hasta los numeros.
function aEnteroPositivo(texto) {
  if (texto === undefined) {
    return null;
  }

  const numero = Number(texto);

  if (!Number.isInteger(numero) || numero < 0) {
    return null; // "abc", "-3" y "2.5" se descartan
  }
  return numero;
}

// --- 1. BUSCAR Y FILTRAR ---
// Recibe la lista entera y los parametros de la URL (req.query).
function filtrar(lista, query) {
  let resultado = lista;

  // search: texto libre dentro del nombre del rival, sin distinguir
  // mayusculas. Nada de expresiones regulares: toLowerCase + includes.
  if (typeof query.search === "string" && query.search.trim() !== "") {
    const buscado = query.search.trim().toLowerCase();
    resultado = resultado.filter((p) => p.rival.toLowerCase().includes(buscado));
  }

  // ganado: en la URL llega como el TEXTO "true" o "false", nunca como
  // booleano, asi que hay que compararlo con comillas.
  if (query.ganado === "true") {
    resultado = resultado.filter((p) => p.ganado === true);
  } else if (query.ganado === "false") {
    resultado = resultado.filter((p) => p.ganado === false);
  }
  // Cualquier otro valor ("si", "1", "") se ignora: no filtra nada.

  // deporte: categoria exacta.
  if (typeof query.deporte === "string" && query.deporte.trim() !== "") {
    resultado = resultado.filter((p) => p.deporte === query.deporte);
  }

  // temporada: categoria exacta.
  if (typeof query.temporada === "string" && query.temporada.trim() !== "") {
    resultado = resultado.filter((p) => p.temporada === query.temporada);
  }

  return resultado;
}

// --- 2. ORDENAR ---
function ordenar(lista, query) {
  // Si no piden orden, o piden un campo que no existe, se queda como esta.
  if (!CAMPOS_ORDENABLES.includes(query.sort)) {
    return lista;
  }

  const campo = query.sort;
  const descendente = query.order === "desc";

  // Copia con [...lista]: sin esto, .sort() cambiaria el array del almacen
  // y el orden se quedaria pegado para las siguientes peticiones.
  const copia = [...lista];

  copia.sort((a, b) => {
    const valorA = a[campo];
    const valorB = b[campo];

    // Los null van siempre al final, pidas el orden que pidas.
    if (valorA === null && valorB === null) return 0;
    if (valorA === null) return 1;
    if (valorB === null) return -1;

    let comparacion;
    if (typeof valorA === "string") {
      comparacion = valorA.localeCompare(valorB);
    } else {
      comparacion = valorA - valorB;
    }

    return descendente ? -comparacion : comparacion;
  });

  return copia;
}

// --- 3. PAGINAR ---
// Devuelve solo el trozo pedido. offset = cuantos saltar, limit = cuantos coger.
function paginar(lista, query) {
  const offset = aEnteroPositivo(query.offset) || 0;
  let limit = aEnteroPositivo(query.limit);

  if (limit === null) {
    limit = lista.length; // sin limit, se devuelve todo
  }
  if (limit > LIMITE_MAXIMO) {
    limit = LIMITE_MAXIMO;
  }

  return lista.slice(offset, offset + limit);
}

// --- 4. ESTADISTICAS ---
// Resumen de TODOS los partidos que le pasemos.
function calcularStats(lista) {
  const ganados = lista.filter((p) => p.ganado === true).length;

  // Cuantos partidos hay de cada deporte: { futbol: 6, tenis: 3, ... }
  const porDeporte = {};
  for (const partido of lista) {
    if (porDeporte[partido.deporte] === undefined) {
      porDeporte[partido.deporte] = 0;
    }
    porDeporte[partido.deporte]++;
  }

  let puntosTotales = 0;
  for (const partido of lista) {
    puntosTotales += partido.puntos;
  }

  // Cuidado con dividir entre cero si algun dia no hay partidos.
  const media = lista.length === 0 ? 0 : puntosTotales / lista.length;

  return {
    total: lista.length,
    ganados,
    perdidos: lista.length - ganados,
    porcentajeVictorias: lista.length === 0 ? 0 : Math.round((ganados / lista.length) * 100),
    puntosTotales,
    puntosPorPartido: Math.round(media * 10) / 10, // un decimal
    porDeporte,
  };
}

module.exports = {
  filtrar,
  ordenar,
  paginar,
  calcularStats,
  CAMPOS_ORDENABLES,
  LIMITE_MAXIMO,
};

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

/*
  Si un parametro llega repetido ("?deporte=tenis&deporte=padel"), Express
  lo entrega como array en vez de como texto. Nos quedamos con el primero.
  Sin esto el filtro se caia entero y se devolvia la coleccion completa,
  que es justo lo contrario de lo que el cliente habia pedido.
*/
function primerValor(valor) {
  if (Array.isArray(valor)) {
    return valor.length > 0 ? valor[0] : undefined;
  }
  return valor;
}

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

  const search = primerValor(query.search);
  const ganado = primerValor(query.ganado);
  const deporte = primerValor(query.deporte);
  const temporada = primerValor(query.temporada);

  // search: texto libre dentro del nombre del rival, sin distinguir
  // mayusculas. Nada de expresiones regulares: toLowerCase + includes.
  if (typeof search === "string" && search.trim() !== "") {
    const buscado = search.trim().toLowerCase();
    resultado = resultado.filter((p) => p.rival.toLowerCase().includes(buscado));
  }

  // ganado: en la URL llega como el TEXTO "true" o "false", nunca como
  // booleano, asi que hay que compararlo con comillas.
  if (ganado === "true") {
    resultado = resultado.filter((p) => p.ganado === true);
  } else if (ganado === "false") {
    resultado = resultado.filter((p) => p.ganado === false);
  }
  // Cualquier otro valor ("si", "1", "") se ignora: no filtra nada.

  // deporte: categoria exacta.
  if (typeof deporte === "string" && deporte.trim() !== "") {
    resultado = resultado.filter((p) => p.deporte === deporte);
  }

  // temporada: categoria exacta.
  if (typeof temporada === "string" && temporada.trim() !== "") {
    resultado = resultado.filter((p) => p.temporada === temporada);
  }

  return resultado;
}

// --- 2. ORDENAR ---
function ordenar(lista, query) {
  // Si no piden orden, o piden un campo que no existe, se queda como esta.
  const campo = primerValor(query.sort);

  if (!CAMPOS_ORDENABLES.includes(campo)) {
    return lista;
  }

  const descendente = primerValor(query.order) === "desc";

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
  const offset = aEnteroPositivo(primerValor(query.offset)) || 0;
  let limit = aEnteroPositivo(primerValor(query.limit));

  // Sin limit se devuelve TODO. El tope de 100 es para los limit que pide
  // el cliente; antes se aplicaba tambien cuando no pedia ninguno, y la
  // lista se cortaba en 100 sin que nadie se enterase.
  if (limit === null) {
    return lista.slice(offset);
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

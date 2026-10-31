/*
  src/validators/partidoValidator.js
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Una sola funcion para los tres verbos que reciben cuerpo:

    POST  y PUT  -> validatePartido(body)                  (completa)
    PATCH        -> validatePartido(body, { partial: true })  (parcial)

  No corta en el primer fallo: recorre TODOS los campos y devuelve la lista
  entera, porque el cliente necesita pintar cada error debajo de su campo.

  No usa expresiones regulares a proposito: todo son comprobaciones
  basicas de tipo, longitud y rango.
*/

// Los unicos deportes admitidos. Es el "conjunto cerrado" del enunciado.
const DEPORTES = ["futbol", "tenis", "baloncesto", "padel"];

const RIVAL_MIN = 2;
const RIVAL_MAX = 80;
const PUNTOS_MIN = 0;
const PUNTOS_MAX = 200;

// Comprueba el formato AAAA-AA, por ejemplo "2018-19".
function formatoTemporada(valor) {
  if (valor.length !== 7) {
    return false;
  }
  if (valor[4] !== "-") {
    return false;
  }

  const digitos = "0123456789";
  for (let i = 0; i < valor.length; i++) {
    if (i === 4) {
      continue; // esa posicion es el guion, ya comprobado
    }
    if (!digitos.includes(valor[i])) {
      return false;
    }
  }
  return true;
}

function validatePartido(body, opciones) {
  const datos = body || {};
  const parcial = opciones !== undefined && opciones.partial === true;
  const errors = [];

  // En modo parcial solo se revisa lo que el cliente ha enviado de verdad.
  // En modo completo se revisan todos los campos, vengan o no.
  function hayQueRevisar(campo) {
    return !parcial || datos[campo] !== undefined;
  }

  // --- rival: texto obligatorio ---
  if (hayQueRevisar("rival")) {
    const rival = datos.rival;

    if (rival === undefined || rival === null) {
      errors.push({ field: "rival", message: "El rival es obligatorio." });
    } else if (typeof rival !== "string") {
      errors.push({ field: "rival", message: "El rival debe ser texto." });
    } else if (
      // [...texto] parte la cadena en CARACTERES de verdad. Con .length
      // un emoji contaria como dos, porque JavaScript mide en unidades
      // UTF-16, y entonces la regla "entre 2 y 80" dejaria de ser cierta.
      [...rival.trim()].length < RIVAL_MIN ||
      [...rival.trim()].length > RIVAL_MAX
    ) {
      errors.push({
        field: "rival",
        message: `El rival debe tener entre ${RIVAL_MIN} y ${RIVAL_MAX} caracteres.`,
      });
    }
  }

  // --- puntos: numero entero dentro de un rango ---
  if (hayQueRevisar("puntos")) {
    const puntos = datos.puntos;

    if (puntos === undefined || puntos === null) {
      errors.push({ field: "puntos", message: "Los puntos son obligatorios." });
    } else if (typeof puntos !== "number" || Number.isNaN(puntos)) {
      // typeof "3" es "string": el texto no cuela aunque parezca un numero
      errors.push({ field: "puntos", message: "Los puntos deben ser un numero." });
    } else if (!Number.isInteger(puntos)) {
      errors.push({ field: "puntos", message: "Los puntos deben ser un numero entero." });
    } else if (puntos < PUNTOS_MIN || puntos > PUNTOS_MAX) {
      errors.push({
        field: "puntos",
        message: `Los puntos deben estar entre ${PUNTOS_MIN} y ${PUNTOS_MAX}.`,
      });
    }
  }

  // --- ganado: booleano ---
  if (hayQueRevisar("ganado")) {
    const ganado = datos.ganado;

    if (ganado === undefined || ganado === null) {
      errors.push({ field: "ganado", message: "Hay que indicar si se gano el partido." });
    } else if (typeof ganado !== "boolean") {
      // las cadenas "true" y "false" NO valen: tiene que ser booleano
      errors.push({ field: "ganado", message: "El campo ganado debe ser true o false." });
    }
  }

  // --- deporte: valor de un conjunto cerrado ---
  if (hayQueRevisar("deporte")) {
    const deporte = datos.deporte;

    if (deporte === undefined || deporte === null) {
      errors.push({ field: "deporte", message: "El deporte es obligatorio." });
    } else if (typeof deporte !== "string") {
      errors.push({ field: "deporte", message: "El deporte debe ser texto." });
    } else if (!DEPORTES.includes(deporte)) {
      errors.push({
        field: "deporte",
        message: `El deporte debe ser uno de: ${DEPORTES.join(", ")}.`,
      });
    }
  }

  // --- temporada: opcional, pero si viene tiene que estar bien ---
  // null se acepta: significa "no la se".
  if (datos.temporada !== undefined && datos.temporada !== null) {
    const temporada = datos.temporada;

    if (typeof temporada !== "string") {
      errors.push({ field: "temporada", message: "La temporada debe ser texto." });
    } else if (!formatoTemporada(temporada.trim())) {
      errors.push({
        field: "temporada",
        message: "La temporada debe tener el formato AAAA-AA, por ejemplo 2018-19.",
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validatePartido, DEPORTES };

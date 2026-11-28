/*
  src/validators/partidoSchema.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  En la P1 el validador estaba escrito a mano, campo por campo. Aqui lo hace
  Zod, que es una libreria de esquemas: se describe la forma que tiene que
  tener el dato y ella comprueba y explica que falla.

  Las reglas son EXACTAMENTE las mismas que los CHECK de la tabla. Estan en
  dos sitios a proposito: el esquema da un 400 con mensajes utiles antes de
  tocar la base de datos, y el CHECK es la ultima red por si alguien inserta
  por fuera de la API. Esta explicado en db/migration-notes.md.

  Dos detalles importantes de Zod:

  - Por defecto DESCARTA las claves que no estan en el esquema. Si alguien
    manda {"rival":"X", "userId":99} el userId desaparece antes de llegar al
    controlador. Eso es lo que impide escribir partidos a nombre de otro.
  - .strict() ademas las rechaza con un 400 en vez de callarselas. Aqui se
    deja el comportamiento por defecto (descartar) porque es mas amable con
    un cliente que mande campos de mas sin mala intencion.
*/

const { z } = require("zod");

const DEPORTES = ["futbol", "tenis", "baloncesto", "padel"];

// AAAA-AA, por ejemplo 2015-16. El mismo patron que el CHECK de la tabla.
const FORMATO_TEMPORADA = /^[0-9]{4}-[0-9]{2}$/;

const rival = z
  .string({ message: "El rival es obligatorio y tiene que ser texto." })
  .trim()
  .min(2, "El rival tiene que tener al menos 2 caracteres.")
  .max(80, "El rival no puede pasar de 80 caracteres.");

/*
  z.number() y no z.coerce.number(): si llega "5" como texto se rechaza en
  vez de convertirlo. El cuerpo de un POST es JSON, que ya distingue numeros
  de textos, asi que mandar un numero entre comillas es un error del cliente
  y es mejor decirselo. (En la URL si hay que convertir, porque ahi todo es
  texto; eso pasa mas abajo, con page y limit.)
*/
const puntos = z
  .number({ message: "Los puntos son obligatorios y tienen que ser un numero." })
  .int("Los puntos tienen que ser un numero entero.")
  .min(0, "Los puntos no pueden ser negativos.")
  .max(200, "Los puntos no pueden pasar de 200.");

const ganado = z.boolean({ message: "Ganado es obligatorio y tiene que ser true o false." });

const deporte = z.enum(DEPORTES, {
  message: `El deporte tiene que ser uno de: ${DEPORTES.join(", ")}.`,
});

/*
  La temporada es el unico campo opcional, y admite tres cosas distintas:
  que venga con formato bueno, que venga como null (borrarla) o que no venga.
  .nullable() permite el null y .optional() permite que falte.
*/
const temporada = z
  .string()
  .regex(FORMATO_TEMPORADA, "La temporada tiene que tener el formato AAAA-AA, por ejemplo 2015-16.")
  .nullable()
  .optional();

// POST y PUT: el partido entero. Todo obligatorio menos la temporada.
const partidoSchema = z.object({
  rival,
  puntos,
  ganado,
  deporte,
  temporada,
});

/*
  PATCH: lo mismo pero todo opcional, porque un PATCH cambia solo lo que
  manda. .partial() lo hace de una vez.

  El refine de abajo rechaza el cuerpo vacio: un PATCH sin ningun campo no
  es un error de la base de datos, pero casi siempre es un fallo del cliente
  y es mejor avisar que hacer una actualizacion que no cambia nada.
*/
const partidoPatchSchema = partidoSchema
  .partial()
  .refine((cuerpo) => Object.keys(cuerpo).length > 0, {
    message: "Hay que mandar al menos un campo para modificar.",
  });

module.exports = { partidoSchema, partidoPatchSchema, DEPORTES };

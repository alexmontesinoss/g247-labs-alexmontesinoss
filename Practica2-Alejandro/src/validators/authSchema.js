/*
  src/validators/authSchema.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Los esquemas del registro y del inicio de sesion.
*/

const { z } = require("zod");

const email = z
  .string({ message: "El correo es obligatorio." })
  .trim()
  .toLowerCase()
  .email("El correo no tiene un formato valido.")
  .max(254, "El correo es demasiado largo.");

/*
  El maximo de 72 no es un capricho: bcrypt solo mira los primeros 72 BYTES
  de la contrasena y el resto lo ignora en silencio. Si se dejara pasar una
  mas larga, dos contrasenas distintas que coincidieran en los primeros 72
  bytes servirian las dos para entrar.

  Y se cuentan BYTES, no caracteres: una "n" ocupa 1 byte pero una "n" con
  virgulilla ocupa 2, asi que .max(72) sobre la longitud del texto no seria
  suficiente. Por eso se mide con Buffer.byteLength.
*/
const password = z
  .string({ message: "La contrasena es obligatoria." })
  .min(8, "La contrasena tiene que tener al menos 8 caracteres.")
  .refine((valor) => Buffer.byteLength(valor, "utf8") <= 72, {
    message: "La contrasena es demasiado larga (maximo 72 bytes).",
  });

const registerSchema = z.object({ email, password });

/*
  En el login la contrasena NO lleva las reglas de longitud. Si las llevara,
  una contrasena de 3 letras daria un 400 ("muy corta") en vez de un 401, y
  eso le estaria contando a quien lo prueba que la comprobacion ni siquiera
  ha llegado a mirar si el usuario existe. Al entrar, todo lo que falle
  tiene que responder lo mismo.
*/
const loginSchema = z.object({
  email: z.string({ message: "El correo es obligatorio." }).trim().toLowerCase(),
  password: z.string({ message: "La contrasena es obligatoria." }),
});

module.exports = { registerSchema, loginSchema };

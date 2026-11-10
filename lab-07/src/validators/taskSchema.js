/*
  src/validators/taskSchema.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2)

  Never trust req.body — every field arriving over HTTP is attacker-
  controlled. Declare one schema per endpoint and reject anything that does
  not match with 400 before it reaches your controller.

  Note what is NOT in the schema: userId. The owner of a task comes from the
  verified token (req.user.sub), never from the client — otherwise a caller
  could create tasks "owned" by someone else.

  Do NOT rename `taskSchema` or `validate`, and keep validate a middleware
  factory: validate(schema) returns an (req, res, next) middleware.
*/

const { z } = require("zod");

const taskSchema = z.object({
  title: z.string().min(1).max(120),
  done: z.boolean().optional().default(false),
});

// validate NO es un middleware: es una FUNCION QUE FABRICA middlewares.
// Por eso en el router se escribe validate(taskSchema) con parentesis, y no
// validate a secas: lo que se monta en la ruta es lo que devuelve la llamada.
// Asi el mismo validate sirve para cualquier esquema.
function validate(schema) {
  return (req, res, next) => {
    // safeParse no lanza: devuelve { success, data } o { success, error }.
    // Con parse normal habria que envolverlo en un try/catch.
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      // issues es la lista de problemas que ha encontrado Zod, con el campo
      // y el motivo de cada uno. Se devuelve entera para que el cliente los
      // pueda pintar todos de golpe.
      return res.status(400).json({ error: parsed.error.issues });
    }

    // Sustituyo req.body por lo que ha salido del esquema, no por lo que
    // llego. Dos motivos: ya tiene los tipos correctos, y los campos que no
    // estan en el esquema se han quedado fuera. A partir de aqui el
    // controlador trabaja con datos limpios y no tiene que desconfiar.
    req.body = parsed.data;
    next();
  };
}

module.exports = { taskSchema, validate };

/*
  Starter — src/validators/taskSchema.js
  Session 27 Lab · Web Application Programming (G247) · CUNEF EPS
  Week 8 · Session 27 · Practice (AF2) · Pair work

  Paste this file into src/validators/taskSchema.js.

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

function validate(schema) {
  return (req, res, next) => {
    // TODO: const parsed = schema.safeParse(req.body);
    // TODO: if (!parsed.success) -> 400 { error: parsed.error.issues } and return.
    // TODO: on success, overwrite req.body with parsed.data (typed + defaulted),
    //   then call next().
  };
}

module.exports = { taskSchema, validate };

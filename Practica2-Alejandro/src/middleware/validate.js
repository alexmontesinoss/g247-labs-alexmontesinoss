/*
  src/middleware/validate.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Middleware reutilizable de validacion.

  Esto no es un middleware, es una FABRICA de middlewares: se le pasa un
  esquema y devuelve la funcion (req, res, next) que Express va a llamar.
  Gracias a eso la ruta queda asi:

      router.post("/", requireAuth, validate(partidoSchema), controlador.crear)

  y el mismo codigo de validacion vale para el POST, el PUT y el PATCH
  cambiando solo el esquema. Es el mismo patron que las factorias de los
  modelos: una funcion que recibe lo que varia y devuelve lo que se usa.
*/

/*
  safeParse y no parse: parse lanza una excepcion cuando el dato esta mal,
  y un cuerpo invalido no es una averia del servidor, es algo que pasa todos
  los dias. safeParse devuelve { success, data, error } y se trata con un if.
*/
function validate(esquema) {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req.body);

    if (!resultado.success) {
      /*
        Una incidencia por campo, que es lo que pide el enunciado. En
        issues[].path viene la ruta hasta el campo que falla, como array
        (["rival"]); se une con puntos por si algun dia hay objetos
        anidados. Si el error es del objeto entero (el refine del PATCH)
        path viene vacio, y entonces se etiqueta como "body".
      */
      const errors = resultado.error.issues.map((incidencia) => ({
        field: incidencia.path.length > 0 ? incidencia.path.join(".") : "body",
        message: incidencia.message,
      }));

      return res.status(400).json({ errors });
    }

    /*
      Se SUSTITUYE req.body por el dato ya validado, no se deja el original.
      Es el paso que de verdad importa: resultado.data solo contiene los
      campos del esquema, ya recortados y en minusculas donde tocaba. Si se
      dejara req.body tal cual, los campos de mas seguirian ahi y el filtro
      no habria servido de nada.
    */
    req.body = resultado.data;
    next();
  };
}

module.exports = validate;

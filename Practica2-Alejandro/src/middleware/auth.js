/*
  src/middleware/auth.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Quien eres (autenticacion) y que te dejo hacer (autorizacion). Son dos
  cosas distintas y por eso son dos middlewares distintos:

    requireAuth  -> no se quien eres        -> 401
    requireRole  -> se quien eres, pero no  -> 403

  Confundir los dos codigos es el fallo tipico. 401 significa "identificate";
  403 significa "ya se quien eres y aun asi no".
*/

const jwt = require("jsonwebtoken");

/*
  El secreto se lee DENTRO de la funcion, no al cargar el fichero.

  Si se leyera arriba del todo, el valor quedaria congelado en el momento del
  require, y cualquiera que importase este modulo antes de cargar el .env se
  quedaria con undefined para siempre. Eso me paso en el laboratorio 7 y las
  pruebas tenian que acordarse de poner la variable ANTES de los require.
  Leyendolo aqui, cada peticion coge el valor que haya en ese momento.
*/
function secreto() {
  const valor = process.env.JWT_SECRET;
  if (!valor) {
    // Sin secreto no se puede firmar nada. Es mejor reventar con un mensaje
    // claro que firmar con "undefined", que serviria para falsificar tokens.
    throw new Error("Falta JWT_SECRET. Copia .env.example a .env y ponle un valor.");
  }
  return valor;
}

const DURACION = "1h";

// Se firma lo MINIMO: quien es y que rol tiene. Nada de meter el correo ni
// mucho menos el hash. Un JWT va firmado, no cifrado: cualquiera que lo
// tenga puede leer su contenido, solo que no puede cambiarlo sin el secreto.
function firmarToken(usuario) {
  return jwt.sign({ sub: usuario.id, role: usuario.role }, secreto(), { expiresIn: DURACION });
}

function requireAuth(req, res, next) {
  const cabecera = req.get("authorization") || "";

  // El formato estandar es "Bearer <token>". Se parte por el espacio en vez
  // de recortar 7 caracteres a ciegas, asi una cabecera rara no cuela.
  const [tipo, token] = cabecera.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "Falta el token. Manda la cabecera Authorization: Bearer <token>." });
  }

  try {
    /*
      verify hace dos cosas de golpe: comprueba la firma con el secreto y
      comprueba que no haya caducado. Si alguien cambia un solo caracter del
      token (por ejemplo el rol, para ponerse de admin) la firma deja de
      cuadrar y esto lanza. Por eso el rol se puede fiar del token.
    */
    const contenido = jwt.verify(token, secreto());
    req.user = { sub: Number(contenido.sub), role: contenido.role };
    next();
  } catch (err) {
    // Caducado o manipulado: para el cliente es lo mismo, vuelve a entrar.
    return res.status(401).json({ error: "Token invalido o caducado." });
  }
}

/*
  Autenticacion OPCIONAL, para las rutas publicas que ademas pueden hacer
  algo extra si resulta que has iniciado sesion (las estadisticas con
  ?mias=true). Si no hay token, se sigue adelante sin req.user en vez de
  cortar con un 401; si lo hay y esta mal, tambien se sigue: la ruta es
  publica, asi que un token roto no deberia impedir ver lo publico.
*/
function optionalAuth(req, res, next) {
  const cabecera = req.get("authorization") || "";
  const [tipo, token] = cabecera.split(" ");

  if (tipo === "Bearer" && token) {
    try {
      const contenido = jwt.verify(token, secreto());
      req.user = { sub: Number(contenido.sub), role: contenido.role };
    } catch (err) {
      // se ignora a proposito
    }
  }

  next();
}

/*
  Fabrica otra vez: requireRole("admin") devuelve el middleware. Va siempre
  DESPUES de requireAuth, porque necesita que req.user ya exista.
*/
function requireRole(rol) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Hay que iniciar sesion." });
    }
    if (req.user.role !== rol) {
      return res.status(403).json({ error: "No tienes permiso para hacer esto." });
    }
    next();
  };
}

/*
  La regla de los permisos sobre un partido, en un solo sitio para que no se
  me olvide en ninguna ruta: lo puede tocar su dueno, o un administrador.

  Es una funcion normal, no un middleware, porque para saber de quien es el
  partido hay que haberlo buscado antes, y esa misma busqueda es la que
  decide si hay que contestar 404.
*/
function puedeTocar(usuario, partido) {
  if (!usuario || !partido) return false;
  return usuario.role === "admin" || partido.user_id === usuario.sub;
}

module.exports = { firmarToken, requireAuth, optionalAuth, requireRole, puedeTocar, DURACION };

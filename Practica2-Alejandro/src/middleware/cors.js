/*
  src/middleware/cors.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  En la P1 el cliente lo servia el propio Express desde public/, asi que
  pagina y API estaban en el mismo sitio y no habia nada que permitir.

  En la P2 el cliente de React corre en su propio servidor de desarrollo
  (Vite, en el puerto 5173) y la API en el 3000. Para el navegador eso son
  DOS ORIGENES DISTINTOS, y por defecto no deja que una pagina de un origen
  lea la respuesta de otro: es la politica del mismo origen, y esta para
  que una web cualquiera no pueda leer tu correo aprovechando que tu sesion
  esta abierta.

  CORS es la forma de decir "yo, la API, autorizo a ese origen". Son unas
  cabeceras en la respuesta; quien las obedece es el navegador.
*/

// Los origenes permitidos. Una lista, no un "*": con asterisco lo permite
// todo, y eso en una API con sesiones no es buena idea.
const PERMITIDOS = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origen) => origen.trim());

function cors(req, res, next) {
  const origen = req.get("origin");

  if (origen && PERMITIDOS.includes(origen)) {
    res.set("Access-Control-Allow-Origin", origen);
    // Le dice a las caches que la respuesta cambia segun el origen que pida.
    res.set("Vary", "Origin");
  }

  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  /*
    La peticion previa. Antes de mandar un PATCH con cabecera Authorization,
    el navegador manda el solo un OPTIONS preguntando "oye, me dejas?". Hay
    que contestarle 204 aqui mismo: si siguiera hacia las rutas, acabaria en
    el 404 y el navegador cancelaria la peticion de verdad.
  */
  if (req.method === "OPTIONS") {
    return res.status(204).send();
  }

  next();
}

module.exports = cors;

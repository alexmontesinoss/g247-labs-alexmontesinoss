/*
  src/mappers/partidoMapper.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Traduce una FILA de la base de datos a lo que ve el cliente.

  Por que existe esta capa:

  1. SQL escribe en minusculas con guion bajo (user_id, created_at) y
     JavaScript y JSON escriben en camelCase (userId, createdAt). Alguien
     tiene que traducir, y mejor en un solo sitio que en cada controlador.

  2. Es la frontera entre la tabla y el contrato publico de la API. Si manana
     renombro una columna, cambio este fichero y el cliente no se entera.
     Sin mapper, el nombre de cada columna seria parte del contrato.

  3. Lo que no este aqui NO SALE. Es la misma idea que el RETURNING del
     modelo de usuarios: si un dia se anade una columna interna a la tabla,
     no se cuela sola en las respuestas.
*/

function toDTO(fila) {
  if (!fila) return null;

  return {
    id: fila.id,
    rival: fila.rival,
    puntos: fila.puntos,
    ganado: fila.ganado,
    deporte: fila.deporte,
    temporada: fila.temporada,
    userId: fila.user_id,
    ownerEmail: fila.owner_email,
    createdAt: fila.created_at,
  };
}

// El usuario nunca lleva password_hash porque el modelo no lo devuelve,
// pero la traduccion de nombres hace falta igual.
function usuarioToDTO(fila) {
  if (!fila) return null;

  return {
    id: fila.id,
    email: fila.email,
    role: fila.role,
    createdAt: fila.created_at,
  };
}

module.exports = { toDTO, usuarioToDTO };

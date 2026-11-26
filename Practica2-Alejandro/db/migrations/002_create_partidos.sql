-- 002_create_partidos.sql
-- Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS
--
-- El recurso de la P1, ahora en PostgreSQL. Mismo dominio y mismos campos,
-- mas dos columnas nuevas: el dueno y la fecha de creacion.
--
-- Las reglas que en la P1 estaban SOLO en el validador de JavaScript ahora
-- estan tambien aqui, como CHECK. No sustituyen al validador: el validador
-- da mensajes buenos por campo y la base de datos es la ultima red. Si
-- alguien insertara por fuera de la API, el CHECK sigue protegiendo.

CREATE TABLE IF NOT EXISTS partidos (
  id         SERIAL PRIMARY KEY,

  -- El dueno. ON DELETE CASCADE: si se borra el usuario, se van sus partidos.
  -- Sin esto quedarian partidos apuntando a un usuario que ya no existe.
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- En la P1: texto de 2 a 80 caracteres, guardado recortado.
  rival      TEXT NOT NULL CHECK (char_length(rival) BETWEEN 2 AND 80),

  -- En la P1: entero entre 0 y 200.
  puntos     INT NOT NULL CHECK (puntos BETWEEN 0 AND 200),

  ganado     BOOLEAN NOT NULL,

  -- En la P1: conjunto cerrado de cuatro deportes.
  deporte    TEXT NOT NULL CHECK (deporte IN ('futbol', 'tenis', 'baloncesto', 'padel')),

  -- Opcional, formato AAAA-AA. NULL significa "no la se", igual que en la P1.
  temporada  TEXT CHECK (temporada IS NULL OR temporada ~ '^[0-9]{4}-[0-9]{2}$'),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indice para el listado por propietario, que es la consulta mas frecuente de
-- toda la aplicacion: cada usuario pide SUS partidos, paginados y ordenados.
-- Sin indice, PostgreSQL recorreria la tabla entera en cada pagina.
CREATE INDEX IF NOT EXISTS idx_partidos_user_id ON partidos (user_id);

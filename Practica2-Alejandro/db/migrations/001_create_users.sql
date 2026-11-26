-- 001_create_users.sql
-- Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS
--
-- Tabla de usuarios. En la P1 no existia: el almacen era un array en memoria
-- y los partidos no tenian dueno. Aqui cada partido pertenece a alguien, asi
-- que lo primero es tener a quien pertenecer.
--
-- Las migraciones van numeradas y se ejecutan en orden. El numero no es
-- decorativo: 002 crea una clave foranea hacia esta tabla, asi que esta tiene
-- que existir antes.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,

  -- UNIQUE para que no haya dos cuentas con el mismo correo. Es la base de
  -- datos la que lo impide, no solo el codigo: aunque dos peticiones llegaran
  -- a la vez y las dos pasaran la comprobacion del controlador, la segunda
  -- insercion fallaria aqui.
  email         TEXT NOT NULL UNIQUE,

  -- Se guarda el HASH, nunca la contrasena. El tamano es fijo (60 caracteres
  -- en bcrypt) pero se deja TEXT para no atarse a un algoritmo concreto.
  password_hash TEXT NOT NULL,

  -- Dos papeles: 'user' y 'admin'. El CHECK impide que se cuele cualquier
  -- otra cosa, aunque el codigo tuviera un fallo.
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

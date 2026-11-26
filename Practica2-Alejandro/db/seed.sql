-- seed.sql — datos iniciales
-- Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS
--
-- Se puede ejecutar las veces que haga falta: vacia las dos tablas antes de
-- insertar. TRUNCATE con RESTART IDENTITY ademas reinicia los contadores de
-- los SERIAL, asi los ids vuelven a empezar en 1 y los datos son siempre los
-- mismos. CASCADE hace falta porque partidos apunta a users.

TRUNCATE TABLE partidos, users RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------------
-- Usuarios. Las contrasenas en claro NO estan aqui: lo que se guarda es el
-- hash de bcrypt con coste 10. Las claves de demostracion estan escritas en
-- el README, porque el enunciado pide dar unas credenciales locales.
-- ---------------------------------------------------------------------
INSERT INTO users (email, password_hash, role) VALUES
  ('alex@cunef.edu',  '$2b$10$DnNgk8ZxvQX8YSeIQLrlte93LN/C7MH2CCHGmuKzI2U1NtFyxi/S.', 'user'),
  ('lucia@cunef.edu', '$2b$10$TVUT6TgX0GMMNIrCfWPYUesqBN70uE4jx1//PGFkQV88uY/HIoqvu', 'user'),
  ('admin@cunef.edu', '$2b$10$q8n0S2vgaz45.N/C1oRgwOxLw5YK13OGqBzPWBIp8vfvT8XQn1y6u', 'admin');

-- ---------------------------------------------------------------------
-- Partidos del usuario 1 (alex): son los catorce de la Practica 1, tal cual.
-- Se conservan a proposito, porque el enunciado pide mantener el dominio y el
-- recurso de P1. Lo unico que cambia es que ahora tienen dueno.
-- ---------------------------------------------------------------------
INSERT INTO partidos (user_id, rival, puntos, ganado, deporte, temporada) VALUES
  (1, 'Algete C.F.',            2,  TRUE,  'futbol',     '2015-16'),
  (1, 'Ajalvir C.D.',           0,  FALSE, 'futbol',     '2016-17'),
  (1, 'Daganzo C.F.',           3,  TRUE,  'futbol',     '2017-18'),
  (1, 'Cobena C.D.',            1,  FALSE, 'futbol',     '2018-19'),
  (1, 'Fuente el Saz C.F.',     4,  TRUE,  'futbol',     '2019-20'),
  (1, 'Valdeolmos C.D.',        1,  TRUE,  'futbol',     '2021-22'),
  (1, 'Hugo Serrano',           12, FALSE, 'tenis',      '2022-23'),
  (1, 'Pablo Marin',            18, TRUE,  'tenis',      '2023-24'),
  (1, 'Diego Ferrer',           15, FALSE, 'tenis',      '2023-24'),
  (1, 'Annandale High School',  41, FALSE, 'baloncesto', '2024-25'),
  (1, 'Dassel-Cokato',          56, TRUE,  'baloncesto', '2024-25'),
  (1, 'Litchfield',             38, FALSE, 'baloncesto', '2024-25'),
  (1, 'Javi y Marcos',          11, TRUE,  'padel',      '2025-26'),
  (1, 'Nico y Alvaro',          8,  FALSE, 'padel',      '2026-27');

-- ---------------------------------------------------------------------
-- Partidos del usuario 2 (lucia). Hacen falta para poder comprobar los
-- permisos: que alex no pueda tocar los de lucia y reciba un 403.
-- Uno deja la temporada a NULL, para que se vea que el campo es opcional.
-- ---------------------------------------------------------------------
INSERT INTO partidos (user_id, rival, puntos, ganado, deporte, temporada) VALUES
  (2, 'Las Rozas C.F.',         2,  TRUE,  'futbol',     '2020-21'),
  (2, 'Majadahonda C.D.',       1,  FALSE, 'futbol',     '2021-22'),
  (2, 'Pozuelo C.F.',           3,  TRUE,  'futbol',     '2022-23'),
  (2, 'Marta Ibanez',           21, TRUE,  'tenis',      '2023-24'),
  (2, 'Claudia Vega',           14, FALSE, 'tenis',      '2024-25'),
  (2, 'Sara Molina',            19, TRUE,  'tenis',      '2025-26'),
  (2, 'Estudiantes B',          44, FALSE, 'baloncesto', '2024-25'),
  (2, 'Canoe juvenil',          61, TRUE,  'baloncesto', '2025-26'),
  (2, 'Real Canoe',             52, FALSE, 'baloncesto', '2025-26'),
  (2, 'Elena y Paula',          9,  TRUE,  'padel',      '2025-26'),
  (2, 'Irene y Carla',          6,  FALSE, 'padel',      NULL);

-- ---------------------------------------------------------------------
-- Partidos del administrador (usuario 3). Pocos, pero hacen falta para
-- comprobar que un administrador puede tocar los de cualquiera sin que eso
-- dependa de tener muchos propios.
-- ---------------------------------------------------------------------
INSERT INTO partidos (user_id, rival, puntos, ganado, deporte, temporada) VALUES
  (3, 'Veteranos CUNEF',        2,  TRUE,  'futbol',     '2026-27'),
  (3, 'Profesores A',           7,  FALSE, 'padel',      '2026-27'),
  (3, 'Antiguos alumnos',       33, TRUE,  'baloncesto', '2026-27');

-- 28 partidos en total, repartidos entre 3 usuarios.

-- queries.sql — Session 22 Lab: SQL & the models/ seam
-- Web Application Programming (G247) · CUNEF EPS · Block II · Week 8
--
-- Run these after schema.sql, e.g. in psql:  \i queries.sql
-- Each query is commented with the question it answers.

-- (a) How many tasks does each user have?
-- Cuantas tareas tiene cada usuario.
-- Uso LEFT JOIN y no JOIN normal para que un usuario SIN tareas siga
-- apareciendo, con un cero. Un JOIN normal lo dejaria fuera de la lista.
-- Cuento COUNT(t.id) y no COUNT(*): en un LEFT JOIN, el usuario sin tareas
-- genera una fila con los campos de tasks a NULL. COUNT(*) contaria esa fila
-- y diria 1; COUNT(t.id) ignora los NULL y dice 0, que es lo correcto.
SELECT u.id,
       u.email,
       COUNT(t.id) AS total_tareas
FROM users u
LEFT JOIN tasks t ON t.user_id = u.id
GROUP BY u.id, u.email
ORDER BY u.id;

-- (b) Who has the most OPEN (not done) tasks?
-- El usuario con mas tareas abiertas (sin terminar).
-- El WHERE filtra ANTES de agrupar, asi que solo entran en el recuento las
-- tareas con done = FALSE. Ordeno de mayor a menor y me quedo con la primera
-- fila con LIMIT 1.
-- Aqui uso JOIN normal a proposito: alguien con cero tareas abiertas no puede
-- ser el que mas tiene, asi que no me interesa que aparezca.
SELECT u.id,
       u.email,
       COUNT(t.id) AS tareas_abiertas
FROM users u
JOIN tasks t ON t.user_id = u.id
WHERE t.done = FALSE
GROUP BY u.id, u.email
ORDER BY tareas_abiertas DESC
LIMIT 1;

-- (c) The five most recently inserted tasks, with the owner's email.
-- Las cinco tareas mas recientes, con el correo de su dueno.
-- La tabla tasks no tiene columna de fecha, asi que uso el id como pista del
-- orden de insercion: es SERIAL, o sea que va subiendo 1, 2, 3... y el id mas
-- alto es siempre el ultimo que se ha metido.
-- DESC ordena de mayor a menor, y LIMIT 5 se queda con las cinco primeras.
SELECT t.id,
       t.title,
       t.done,
       u.email
FROM tasks t
JOIN users u ON u.id = t.user_id
ORDER BY t.id DESC
LIMIT 5;

-- (d) Paginated list of tasks — 10 per page.
-- La misma consulta dos veces, cambiando solo el OFFSET, para ver que cada
-- desplazamiento devuelve filas distintas.
-- LIMIT dice cuantas filas quiero y OFFSET cuantas me salto antes de empezar.
-- El ORDER BY es imprescindible: sin el, la base de datos no garantiza ningun
-- orden, y entre una pagina y la siguiente podrian repetirse filas o perderse.

-- Pagina empezando por el principio: se salta 0 filas.
SELECT id, user_id, title, done
FROM tasks
ORDER BY id
LIMIT 10 OFFSET 0;

-- La misma consulta saltandose las 2 primeras filas: empieza en la tarea 3.
SELECT id, user_id, title, done
FROM tasks
ORDER BY id
LIMIT 10 OFFSET 2;

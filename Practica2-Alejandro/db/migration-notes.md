# Notas de migracion: de la Practica 1 a PostgreSQL

Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS
Alejandro Montesinos · modalidad individual

Este documento explica como se ha pasado el recurso `partido` de un array en
memoria a una base de datos relacional, que ha cambiado por el camino y que
capas del codigo se han visto afectadas.

La version anterior sigue estando en el historial del repositorio, en la
carpeta `Practica1-Alejandro/`.

---

## 1. De donde se partia

En la P1 los partidos vivian en un array dentro de `src/data/store.js`:

```js
let partidos = [
  { id: 1, rival: "Algete C.F.", puntos: 2, ganado: true, deporte: "futbol", temporada: "2015-16" },
  ...
];
let nextId = 15;
```

Tres consecuencias de aquello, y las tres desaparecen ahora:

1. **No habia persistencia.** Al parar el servidor se perdia todo lo creado.
2. **No habia duenos.** Cualquiera podia editar cualquier partido, porque no
   habia ni usuarios.
3. **Los ids los generaba JavaScript** con un contador (`nextId`). Ahora los
   genera la base de datos con `SERIAL`.

---

## 2. Correspondencia de campos

| Campo en P1 | Tipo en JavaScript | Columna en PostgreSQL | Cambio |
|---|---|---|---|
| `id` | `number`, contador propio | `id SERIAL PRIMARY KEY` | **Lo genera ahora la base de datos** |
| `rival` | `string`, 2–80 caracteres | `rival TEXT NOT NULL` + `CHECK (char_length BETWEEN 2 AND 80)` | La regla pasa a estar tambien en la tabla |
| `puntos` | `number` entero, 0–200 | `puntos INT NOT NULL` + `CHECK (BETWEEN 0 AND 200)` | `number` de JS admite decimales; `INT` no |
| `ganado` | `boolean` | `ganado BOOLEAN NOT NULL` | Equivalente directo |
| `deporte` | `string` de una lista cerrada | `deporte TEXT NOT NULL` + `CHECK (IN (...))` | La lista cerrada pasa a la tabla |
| `temporada` | `string` AAAA-AA, opcional | `temporada TEXT` + `CHECK (NULL OR formato)` | `undefined` y `null` de JS se unifican en `NULL` |
| — | no existia | `user_id INT NOT NULL REFERENCES users(id)` | **Columna nueva: el dueno** |
| — | no existia | `created_at TIMESTAMP NOT NULL DEFAULT NOW()` | **Columna nueva** |

**Ningun campo cambia de nombre.** El contrato HTTP que ya documentaba la P1 se
mantiene, y eso era un objetivo: la P2 anade cosas, no rompe lo anterior.

### El unico punto donde el nombre no coincide

La columna se llama `user_id` (minusculas con guion bajo) porque es la
convencion de SQL, pero la API sigue hablando en `userId` (camelCase), que es
la convencion de JavaScript y JSON. Esa traduccion la hace un **mapper** en
`src/mappers/`, y existe para que un cambio de nombre en una columna no obligue
a cambiar el contrato publico de la API.

---

## 3. Por que las reglas estan en dos sitios

Las mismas reglas (longitudes, rangos, lista de deportes) estan ahora en el
validador de Zod **y** como `CHECK` en la tabla. No es duplicar por duplicar:

- **El validador** da mensajes buenos por campo y devuelve `400` antes de que
  la peticion llegue a tocar la base de datos.
- **El `CHECK`** es la ultima red. Si alguien insertara por fuera de la API
  —desde `psql`, desde otro programa, o por un fallo mio— la regla sigue
  aplicandose.

El validador es comodidad; la base de datos es la garantia. Es el mismo
razonamiento que en la P1 con la validacion del cliente y la del servidor.

---

## 4. Que se ha hecho con los datos que ya existian

Los **catorce partidos** de la P1 estan en `db/seed.sql` tal cual, con los
mismos valores. Como en la P1 no habia usuarios, habia que decidir de quien
pasaban a ser: se le asignan al usuario 1 (`alex@cunef.edu`), que es el autor.

A esos catorce se les suman **catorce mas** repartidos entre otro usuario
normal y el administrador, hasta **28 partidos y 3 usuarios**. Hacen falta por
dos motivos: el enunciado pide un minimo de 25 elementos entre al menos dos
usuarios, y sin partidos de otra persona **no se podria comprobar el 403**.

Los ids no se conservan a la fuerza: `SERIAL` los vuelve a asignar desde 1. Al
cargarse en el mismo orden, los catorce primeros acaban con los mismos ids que
tenian, pero eso es una coincidencia comoda, no una garantia.

---

## 5. Capas que han cambiado

| Capa | Antes (P1) | Ahora (P2) |
|---|---|---|
| Datos | `src/data/store.js`, array en memoria | `db/migrations/` + PostgreSQL |
| Acceso a datos | funciones sincronas sobre el array | `src/models/`, con la base de datos **inyectada** y todo `async` |
| Consultas | `src/utils/consultas.js`, filtrado en JavaScript | **SQL**: `WHERE`, `ORDER BY`, `LIMIT`, `OFFSET` |
| Validacion | validador propio escrito a mano | **Zod** con un middleware reutilizable |
| Autenticacion | no habia | `bcrypt`, JWT, middleware `auth` y roles |
| Cliente | `public/`, JavaScript vanilla | `client/`, React con Vite |

### El cambio con mas consecuencias: todo pasa a ser `async`

En la P1, `store.findById(5)` devolvia el partido en el acto. Ahora hay que
esperar a que conteste la base de datos, asi que devuelve una promesa y hay que
hacer `await`. Eso obliga a que **todos los controladores sean `async`** y a que
los errores se reenvien con `next(err)` en vez de dejarlos escapar.

### El filtrado se baja a SQL, y no es un capricho

En la P1 el servidor se traia la lista entera a memoria y la filtraba con
`.filter()`. Con 14 partidos daba igual. Con una tabla de verdad no: filtrar en
JavaScript obliga a traerse **todas** las filas en cada peticion para luego
tirar casi todas. En SQL, el `WHERE` y el `LIMIT` los resuelve PostgreSQL y solo
viajan las filas que se van a usar.

Es el mismo principio que ya aparecio en el laboratorio 9 al pedir `?_limit=10`
en vez de descargar cien publicaciones: **se recorta donde estan los datos**.

---

## 6. Seguridad del SQL

Todas las consultas van **parametrizadas** con `$1`, `$2`, ... Nunca se
construye SQL pegando texto que venga del usuario.

El motivo es que el valor no llegue a formar parte de la consulta: se mandan
por separado la consulta con huecos y los valores que van en esos huecos, y
PostgreSQL decide que va a hacer **antes** de mirar los valores. Asi, aunque
alguien envie `1 OR 1=1`, se busca un partido cuyo id sea ese texto, no se
ejecuta como condicion.

**La ordenacion es la excepcion que hay que tratar aparte.** El nombre de una
columna no se puede mandar como parametro: `ORDER BY $1` no funciona, porque un
parametro es un valor, no un trozo de consulta. Por eso el campo por el que se
ordena se comprueba contra una **lista blanca de columnas admitidas**, y si no
esta en la lista se usa el orden por defecto. Nunca se pega directamente en el
SQL lo que llegue por la URL.

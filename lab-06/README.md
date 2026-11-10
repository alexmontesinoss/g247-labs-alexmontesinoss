# Laboratorio 6 — SQL y la capa `models/`

Alejandro Montesinos — usuario de GitHub: `alexmontesinoss` — modalidad: **individual**

La API del laboratorio 5 guardaba las tareas en un array. Aqui ese almacenamiento
se sustituye por una base de datos relacional: se disenan las tablas, se escriben
las consultas y se encapsulan en un modelo de Node.

## Contenido

| Fichero | Que es |
|---|---|
| `schema.sql` | Las tablas `users` y `tasks` y los datos de prueba |
| `queries.sql` | Las cuatro consultas pedidas, cada una comentada |
| `src/models/tasksModel.js` | El modelo: seis metodos, todos parametrizados |
| `tests/tasksModel.test.js` | Las pruebas automaticas |
| `tests/helpers/fakeDb.js` | Base de datos falsa en memoria para las pruebas |

## Como se ejecuta

```bash
npm install
npm test
```

Las pruebas **no necesitan PostgreSQL**: el modelo recibe la base de datos como
parametro, y en las pruebas se le pasa la falsa de `tests/helpers/fakeDb.js`.

## La variable de entorno `DATABASE_URL`

Para usar el modelo contra una base de datos real hace falta `DATABASE_URL`, que
es la cadena de conexion a PostgreSQL. Tiene esta forma:

```
postgres://usuario:contrasena@servidor:puerto/nombre_de_la_base
```

Por ejemplo:

```bash
export DATABASE_URL="postgres://postgres:1234@localhost:5432/g247"
npm run db:schema     # crea las tablas y mete los datos de prueba
```

Y entonces el modelo se construye asi:

```javascript
const { Pool } = require("pg");
const { createTasksModel } = require("./src/models/tasksModel");

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const tasksModel = createTasksModel(db);
```

`DATABASE_URL` va en una **variable de entorno y no en el codigo** porque lleva
dentro la contrasena de la base de datos. Si estuviera escrita en un fichero del
repositorio, quedaria publicada en GitHub para siempre. Por eso `.env` esta en
el `.gitignore`.

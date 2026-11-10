# Laboratorio 7 — Autenticacion, paginacion y permisos

Alejandro Montesinos — usuario de GitHub: `alexmontesinoss` — modalidad: **individual**

Este laboratorio coge la API de tareas y le anade cuatro cosas: registro y
acceso de usuarios, un token que hay que presentar en cada peticion, una
comprobacion de que la tarea que tocas es tuya, y un listado paginado.

El modelo `src/models/tasksModel.js` es el del laboratorio 6, copiado tal cual.

## Estructura

```
src/
  app.js                        monta la aplicacion (infraestructura)
  server.js                     arranca el servidor
  middleware/auth.js            lee y verifica el token  -> 401
  validators/taskSchema.js      valida el cuerpo con Zod -> 400
  models/tasksModel.js          el modelo del laboratorio 6
  models/usersModel.js          usuarios: buscar por correo y crear
  controllers/authController.js registro y acceso
  controllers/tasksController.js las cinco operaciones, con permisos -> 403
  routes/auth.js                rutas publicas
  routes/tasks.js               rutas protegidas
tests/
  api.test.js                   las 2 del profesor
  auth.test.js                  registro y acceso
  tasks.test.js                 permisos, validacion y paginacion
  helpers/fakeDb.js             base de datos falsa en memoria
```

## Las pruebas

`npm test` ejecuta **31 pruebas** y **no necesita PostgreSQL**: el modelo recibe
la base de datos como parametro, asi que en las pruebas se le pasa la falsa de
`tests/helpers/fakeDb.js`.

Cubren registro, acceso, `401`, `403`, `400` y paginacion, que es lo que pide
el apartado 6.9 del enunciado.

Para comprobar que no son decorativas se rompio el codigo a proposito:

| Rotura | Pruebas en rojo |
|---|---|
| Quitar la comprobacion de propiedad | 2 |
| Quitar el tope de `limit` | 1 |
| Hacer el esquema de Zod permisivo | 1 |
| Coger el dueno del cuerpo en vez del token | **0** |

La ultima fila es la interesante: **no fallo ninguna**. El motivo es que Zod
tira los campos que no estan declarados en el esquema, asi que `req.body.userId`
ya era `undefined` antes de llegar al controlador. La proteccion no estaba donde
parecia, y por eso se anadio una prueba que vigila el sitio correcto: que el
esquema descarte los campos no declarados.

## Como se ejecuta

```bash
npm install
npm test
```

Para arrancar el servidor de verdad hacen falta las dos variables de entorno:

```bash
export DATABASE_URL="postgres://usuario:contrasena@localhost:5432/g247_lab7"
export JWT_SECRET="$(openssl rand -hex 32)"
psql "$DATABASE_URL" -f schema.sql
npm start
```

`src/server.js` comprueba que las dos existan y **se niega a arrancar si falta
alguna**. Es mejor que reviente al arrancar a que arranque con un secreto vacio
y firme tokens que cualquiera podria falsificar.

## Las dos variables de entorno

| Variable | Que es |
|---|---|
| `DATABASE_URL` | La cadena de conexion a PostgreSQL. Lleva la contrasena dentro |
| `JWT_SECRET` | La clave con la que se firman y se verifican los tokens |

**Ninguna de las dos se escribe nunca en el repositorio.** Si el `JWT_SECRET`
estuviera publicado en GitHub, cualquiera podria fabricarse un token valido
diciendo ser el usuario que quisiera, y toda la autenticacion no serviria de
nada. Por eso `.env` esta en el `.gitignore`.

## La base de datos es NUEVA

`schema.sql` crea una base de datos **distinta de la del laboratorio 6**. La
tabla `users` gana dos columnas:

```sql
password_hash TEXT NOT NULL,
role          TEXT NOT NULL DEFAULT 'user'
```

No se puede reaprovechar la base del laboratorio 6: sus usuarios no tienen
contrasena guardada, y anadir una columna `NOT NULL` a una tabla que ya tiene
filas da error, porque esas filas se quedarian con el campo vacio.

## Los codigos de estado nuevos

| Codigo | Cuando |
|---|---|
| `401` | No se quien eres: no has mandado token, o el token no vale |
| `403` | Se quien eres, y por eso mismo no te dejo: esa tarea es de otro |
| `409` | Ese correo ya esta registrado |
| `400` | El cuerpo de la peticion no pasa la validacion de Zod |

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
  api.test.js
```

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

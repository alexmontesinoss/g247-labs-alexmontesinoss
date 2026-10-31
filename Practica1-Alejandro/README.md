# Practica 1 — API de partidos

**Programacion de Aplicaciones Web (G247) · CUNEF Escuela Politecnica Superior**

- **Integrante:** Alejandro Montesinos
- **Modalidad:** individual
- **Tema:** mi trayectoria deportiva, el mismo del bloque I
- **Recurso:** `partido` — cada partido que he jugado en los cuatro deportes que he practicado (futbol, tenis, baloncesto y padel)

---

## Puesta en marcha

Hace falta Node.js 18 o superior.

```bash
npm install     # instala las dependencias
npm start       # arranca el servidor
npm test        # lanza las 92 pruebas automaticas
```

El servidor queda escuchando en `http://localhost:3000`. Se para con `Ctrl + C`.

Abriendo `http://localhost:3000` en el navegador sale el cliente web. La API responde en `http://localhost:3000/partidos`.

Para arrancarlo en otro puerto: `PORT=3100 npm start`.

---

## Forma del recurso

```json
{
  "id": 3,
  "rival": "Daganzo C.F.",
  "puntos": 3,
  "ganado": true,
  "deporte": "futbol",
  "temporada": "2017-18"
}
```

### Reglas de cada campo

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `id` | numero entero | lo pone el servidor | Lo genera el servidor de forma incremental. **Si el cliente lo envia, se ignora**; nunca se acepta desde fuera. |
| `rival` | texto | si | Entre 2 y 80 caracteres, sin contar los espacios de los extremos. Se guarda recortado. Es el campo sobre el que busca `search=`. |
| `puntos` | numero entero | si | Entre 0 y 200. Son los goles o puntos que marco mi equipo en ese partido: en futbol seran 0-5, en baloncesto 30-90. |
| `ganado` | booleano | si | `true` si ganamos, `false` si no. Solo acepta booleanos de verdad, no las cadenas `"true"` y `"false"`. |
| `deporte` | texto de valores cerrados | si | Exactamente uno de: `futbol`, `tenis`, `baloncesto`, `padel`. Cualquier otro valor es un error. |
| `temporada` | texto | no | Formato `AAAA-AA`, por ejemplo `2018-19`. Si no se envia, queda a `null`. Se valida y se guarda recortada. |

Los campos que no esten en esta tabla **no se guardan**: si el cliente manda cualquier otra cosa, se descarta en silencio.

La longitud de `rival` se cuenta en caracteres de verdad, no en unidades UTF-16, asi que un emoji cuenta como uno.

Solo se comprueba el **formato** de `temporada`, no que los dos años sean consecutivos: `2018-99` se acepta.

---

## Endpoints

| Metodo | Ruta | Parametros | Exito | Errores |
|---|---|---|---|---|
| `GET` | `/health` | — | `200` `{"status":"ok"}` | — |
| `GET` | `/partidos` | `search`, `deporte`, `ganado`, `temporada`, `sort`, `order`, `limit`, `offset` | `200` + lista + cabecera `X-Total-Count` | — |
| `GET` | `/partidos/stats` | los mismos filtros | `200` + resumen | — |
| `GET` | `/partidos/:id` | — | `200` + el partido | `404` |
| `POST` | `/partidos` | — | `201` + el partido + cabecera `Location` | `400`, `413` |
| `PUT` | `/partidos/:id` | — | `200` + el partido sustituido | `400`, `404`, `413` |
| `PATCH` | `/partidos/:id` | — | `200` + el partido actualizado | `400`, `404`, `413` |
| `DELETE` | `/partidos/:id` | — | `204` sin cuerpo | `404` |

Cualquier otra ruta devuelve `404` con `{"error":"Ruta no encontrada"}`.

El `:id` de la ruta tiene que ser **solo digitos**. `/partidos/abc` y `/partidos/1e1` devuelven `404`; `/partidos/03` si vale, porque es el numero 3.

### Codigos de estado

| Codigo | Cuando |
|---|---|
| `200 OK` | lectura correcta, o `PUT` / `PATCH` correctos |
| `201 Created` | creacion correcta. Lleva `Location` con la ruta del partido nuevo |
| `204 No Content` | borrado correcto. No lleva cuerpo |
| `400 Bad Request` | el cuerpo no pasa la validacion, o no es JSON valido |
| `404 Not Found` | el partido no existe, o la ruta no existe |
| `413 Payload Too Large` | el cuerpo de la peticion pasa de 100 kB (lo corta `express.json()`) |
| `500 Internal Server Error` | fallo inesperado. Solo devuelve `{"error":"Error del servidor"}`; la traza se queda en la terminal del servidor |

---

## Ejemplos

### Crear un partido

```bash
curl -i -X POST http://localhost:3000/partidos \
  -H "Content-Type: application/json" \
  -d '{"rival":"Algete C.F.","puntos":2,"ganado":true,"deporte":"futbol","temporada":"2015-16"}'
```

```
HTTP/1.1 201 Created
Location: /partidos/15
```
```json
{
  "id": 15,
  "rival": "Algete C.F.",
  "puntos": 2,
  "ganado": true,
  "deporte": "futbol",
  "temporada": "2015-16"
}
```

### Un cuerpo invalido: salen todas las incidencias de golpe

```bash
curl -X POST http://localhost:3000/partidos \
  -H "Content-Type: application/json" \
  -d '{"rival":"","puntos":-5,"ganado":"si","deporte":"curling"}'
```

```json
{
  "errors": [
    { "field": "rival",   "message": "El rival debe tener entre 2 y 80 caracteres." },
    { "field": "puntos",  "message": "Los puntos deben estar entre 0 y 200." },
    { "field": "ganado",  "message": "El campo ganado debe ser true o false." },
    { "field": "deporte", "message": "El deporte debe ser uno de: futbol, tenis, baloncesto, padel." }
  ]
}
```

Nunca se devuelve solo el primer fallo: la lista viene entera para que el cliente pueda pintar cada mensaje debajo de su campo sin tener que reenviar el formulario varias veces.

### Listar con filtros, orden y paginacion

```bash
curl -i "http://localhost:3000/partidos?deporte=tenis&sort=puntos&order=desc&limit=2"
```

```
HTTP/1.1 200 OK
X-Total-Count: 3
```
```json
[
  { "id": 8, "rival": "Pablo Marin",  "puntos": 18, "ganado": true,  "deporte": "tenis", "temporada": "2023-24" },
  { "id": 9, "rival": "Diego Ferrer", "puntos": 15, "ganado": false, "deporte": "tenis", "temporada": "2023-24" }
]
```

`X-Total-Count` dice cuantos hay **tras filtrar y antes de paginar**: hay 3 partidos de tenis aunque solo se devuelvan 2.

### Cambiar un solo campo

```bash
curl -X PATCH http://localhost:3000/partidos/1 \
  -H "Content-Type: application/json" \
  -d '{"ganado":false}'
```

```json
{
  "id": 1,
  "rival": "Algete C.F.",
  "puntos": 2,
  "ganado": false,
  "deporte": "futbol",
  "temporada": "2015-16"
}
```

### Errores de ruta y de recurso

```bash
curl http://localhost:3000/partidos/999   # {"error":"Partido no encontrado"}
curl http://localhost:3000/ruta-inventada # {"error":"Ruta no encontrada"}
```

---

## Consulta de la coleccion

Todos los parametros se pueden combinar.

| Parametro | Que hace |
|---|---|
| `search=<texto>` | busca un trozo dentro de `rival`, sin distinguir mayusculas |
| `deporte=<valor>` | filtra por deporte exacto |
| `ganado=true` / `ganado=false` | filtra por resultado |
| `temporada=<valor>` | filtra por temporada exacta |
| `sort=<campo>&order=asc\|desc` | ordena. Campos admitidos: `id`, `rival`, `puntos`, `deporte`, `temporada`. Por defecto ascendente |
| `limit=<n>&offset=<n>` | ventana de resultados |

**El orden de aplicacion es siempre: filtrar, luego ordenar, luego paginar.** En otro orden saldrian cosas distintas: paginar antes de ordenar daria la primera pagina de la lista sin ordenar, ya ordenada por dentro pero con los elementos equivocados.

Detalles que conviene saber:

- Los valores van en **minuscula**. `order=DESC` y `ganado=TRUE` no se reconocen y se ignoran.
- `sort=rival` compara textos con `localeCompare`, que no distingue mayusculas y usa las reglas del idioma.
- Al ordenar, los valores `null` van **siempre al final**, se pida `asc` o `desc`.
- Sin `limit` se devuelven **todos** los resultados. El tope de 100 solo se aplica al `limit` que pide el cliente: `limit=500` devuelve 100.
- `limit=0` devuelve una lista vacia, con el `X-Total-Count` real.

### Politica de parametros desconocidos o mal formados

**Se ignoran.** No producen un `400` y no pueden detener el servidor.

- Un parametro que no existe (`?inventado=42`) no hace nada.
- Un valor mal formado (`?limit=abc`, `?limit=-5`, `?sort=zzz`) se descarta y el resto de la consulta sigue funcionando.
- Si un parametro llega **repetido** (`?deporte=tenis&deporte=padel`), se usa **el primer valor**. No se desactiva el filtro: desactivarlo devolveria mas datos de los pedidos, que es peor que no filtrar, porque el cliente ensenaria registros que creia descartados.

Hay una excepcion a "se ignoran": un `limit` valido pero por encima del maximo **no se ignora, se recorta a 100**. La diferencia es deliberada: `limit=abc` no significa nada, mientras que `limit=500` significa algo perfectamente claro que simplemente no se permite del todo.

### Estadisticas

`GET /partidos/stats` devuelve un resumen **calculado en cada peticion**, nunca almacenado. Acepta los mismos filtros que el listado.

```json
{
  "total": 14,
  "ganados": 7,
  "perdidos": 7,
  "porcentajeVictorias": 50,
  "puntosTotales": 210,
  "puntosPorPartido": 15,
  "porDeporte": { "futbol": 6, "tenis": 3, "baloncesto": 3, "padel": 2 }
}
```

- `porcentajeVictorias` va redondeado a entero; `puntosPorPartido`, a un decimal.
- `porDeporte` solo lista los deportes que **tienen** partidos: es un recuento de lo que hay, no un formulario con todas las casillas.
- Si ningun partido encaja con los filtros, todo sale a `0` y `porDeporte` queda vacio. No hay division entre cero.

La ruta `/partidos/stats` se declara **antes** que `/partidos/:id` en `src/routes/partidos.js`. Express prueba las rutas de arriba abajo, asi que si `/:id` fuera primero, la palabra `stats` encajaria como si fuera un identificador y nunca se llegaria a las estadisticas.

---

## PUT frente a PATCH

Los dos cambian un partido que ya existe, pero no hacen lo mismo:

| | `PUT` | `PATCH` |
|---|---|---|
| Que hace | **sustituye el partido entero** | cambia **solo los campos enviados** |
| Validacion | completa: exige todos los campos obligatorios | parcial: solo revisa lo que llega |
| Lo que no envias | vuelve a su valor por defecto (`temporada` pasa a `null`) | se queda como estaba |
| Cuerpo vacio | `400`, faltan los obligatorios | `400`, hay que enviar al menos un campo |

En los dos, si el `:id` no existe se devuelve `404` **aunque el cuerpo tambien este mal**. El 404 va primero porque, si el partido no existe, da igual lo que traiga la peticion.

### Cual usa el cliente al editar

Las dos, cada una donde tiene sentido:

- El **formulario de edicion** usa `PUT`. El formulario ensena los cinco campos y los manda todos, asi que esta describiendo el partido entero: sustituirlo es exactamente lo que quiere hacer.
- El boton **"Marcar ganado / Marcar perdido"** de cada fila usa `PATCH`. Ese boton solo cambia `ganado` y no sabe nada del resto. Con `PUT` habria que reenviar los otros cuatro campos solo para darle la vuelta a un booleano, y si alguien hubiera editado el partido mientras tanto, se machacarian sus cambios.

---

## Cliente web

Esta en `public/` y son tres ficheros: `index.html`, `styles.css` y `app.js`. HTML, CSS y JavaScript a secas: ni React, ni jQuery, ni Bootstrap, ni Tailwind.

La pagina lista los partidos, deja crearlos, editarlos y borrarlos, busca, filtra, ordena y pagina, y **no se recarga nunca**: todo va por `fetch`.

Comprueba siempre `response.ok` antes de fiarse de una respuesta, porque `fetch` **no** considera un error que el servidor conteste `404` o `500`: solo falla si no consigue llegar al servidor. Sin esa comprobacion, un 404 se colaria como si fuera una respuesta buena.

La validacion se hace **dos veces, a proposito**:

- En el cliente, antes de mandar nada, para que el fallo se vea al momento y no haya que esperar a un viaje de ida y vuelta.
- En el servidor, que es el que manda de verdad. Cualquiera puede saltarse el navegador y llamar a la API directamente con `curl`, asi que la validacion del cliente es una comodidad, nunca una defensa.

Cuando la API devuelve un `400`, el cliente recorre la lista `errors` y pinta cada mensaje debajo de su campo.

### Donde se instala `express.static`, y por que

En `src/app.js`, **antes** del `404` de ruta no encontrada:

```js
app.use(express.static(path.join(__dirname, "..", "public")));
```

El orden importa. El middleware que devuelve `404` esta al final del fichero y se traga cualquier peticion que haya llegado hasta el. Si `express.static` fuera despues, nunca se llegaria a mirar en la carpeta `public/` y la pagina daria `404`.

Sirviendo la pagina desde el mismo servidor que la API, las dos comparten origen. Asi el cliente puede pedir `/partidos` sin escribir el dominio y **no hace falta configurar CORS**, que es lo que haria falta si la pagina viviera en otro sitio.

### Por que el filtrado se hace en el servidor

La pagina monta la URL con los parametros (`/partidos?deporte=tenis&limit=5`) y pinta lo que vuelve. No filtra nada por su cuenta. Tres razones:

1. **No se manda de mas.** Filtrando en el servidor viajan por la red los partidos que hacen falta. Filtrando en el navegador habria que mandar la coleccion entera en cada busqueda para tirar casi todo.
2. **No depende del ordenador del usuario.** El trabajo lo hace una maquina conocida, no un movil de hace seis anos.
3. **Es lo unico que escala.** Con 14 partidos da igual, pero con 50.000 el navegador no puede recibir la lista completa. Si la logica vive en el servidor, no hay que reescribir el cliente cuando eso pase.

Ademas, cualquier otro cliente —otra pagina, una aplicacion de movil, un `curl`— se encuentra el filtrado ya hecho en vez de tener que repetirlo.

---

## Almacenamiento

Los datos viven **solo en memoria**, en `src/data/store.js`. No hay base de datos: al reiniciar el servidor vuelven los 14 partidos de partida y se pierde todo lo creado.

Ese fichero es el unico que toca el array. El controlador no accede nunca a los datos directamente, sino a traves de las funciones que exporta (`findAll`, `findById`, `insert`, `replace`, `update`, `remove`). La idea es que sustituir el array por una base de datos solo obligue a reescribir ese modulo.

---

## Estructura del proyecto

```
Practica1-Alejandro/
├── package.json
├── README.md
├── src/
│   ├── app.js                        construye la aplicacion y la exporta
│   ├── server.js                     lo unico que llama a listen
│   ├── middleware/logger.js          una linea por peticion
│   ├── routes/partidos.js            router fino: verbo + ruta -> controlador
│   ├── controllers/partidosController.js
│   ├── data/store.js                 el unico que toca el array
│   ├── validators/partidoValidator.js
│   └── utils/consultas.js            filtros, orden, paginacion y stats
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js                        el cliente, con fetch
├── tests/
│   ├── partidos.test.js              41 pruebas del CRUD
│   ├── consultas.test.js             32 pruebas de filtros y stats
│   └── agente.test.js                19 pruebas salidas del tester agent
└── AI/
    ├── agents.md                     configuracion y contrato del agente
    └── review-log.md                 revision critica de sus hallazgos
```

`src/app.js` **exporta la aplicacion y no llama a `listen`**: de eso se encarga `src/server.js`. Esa separacion es lo que permite que las pruebas importen la aplicacion y la manejen por dentro sin abrir ningun puerto.

---

## Pruebas automaticas

```bash
npm test
```

92 pruebas con Jest y Supertest, repartidas en tres ficheros. Supertest maneja la aplicacion en el mismo proceso, sin levantar el servidor.

El fichero `tests/agente.test.js` es distinto de los otros dos: sus 19 pruebas salen de los fallos que encontro el tester agent de caja negra. Todas fallaban antes de corregir el codigo y pasan despues. Estan documentadas una por una en [AI/review-log.md](AI/review-log.md).

---

## Componente de IA

En [AI/agents.md](AI/agents.md) estan la configuracion del agente, el contrato que recibio y las 124 comprobaciones que genero.

En [AI/review-log.md](AI/review-log.md) esta la revision critica: de las 14 discrepancias que senalo, **5 se aceptaron y estan corregidas** y **9 se rechazaron**, con el motivo de cada decision. Tambien estan apuntados los tres sitios donde el agente se equivoco y los dos donde me equivoque yo al escribir las pruebas.

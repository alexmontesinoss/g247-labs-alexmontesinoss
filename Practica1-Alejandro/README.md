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
npm install
npm start
```

El servidor queda escuchando en `http://localhost:3000`. Se para con `Ctrl + C`.

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
| `rival` | texto | si | Entre 2 y 80 caracteres. No puede quedarse en blanco ni ser solo espacios. Es el campo sobre el que busca `search=`. |
| `puntos` | numero entero | si | Entre 0 y 200. Son los goles o puntos que marco mi equipo en ese partido: en futbol seran 0-5, en baloncesto 30-90. |
| `ganado` | booleano | si | `true` si ganamos, `false` si no. Solo acepta booleanos de verdad, no las cadenas `"true"` y `"false"`. |
| `deporte` | texto de valores cerrados | si | Exactamente uno de: `futbol`, `tenis`, `baloncesto`, `padel`. Cualquier otro valor es un error. |
| `temporada` | texto | no | Formato `AAAA-AA`, por ejemplo `2018-19`. Si no se envia, queda a `null`. |

Los campos que no esten en esta tabla **no se guardan**: si el cliente manda cualquier otra cosa, se descarta en silencio.

---

## Almacenamiento

Los datos viven **solo en memoria**, en `src/data/store.js`. No hay base de datos: al reiniciar el servidor vuelven los 14 partidos de partida.

Ese fichero es el unico que toca el array. El controlador no accede nunca a los datos directamente, sino a traves de las funciones que exporta (`findAll`, `findById`, `insert`, `replace`, `update`, `remove`). La idea es que sustituir el array por una base de datos solo obligue a reescribir ese modulo.

---

## Pendiente de documentar

Las secciones siguientes se completan segun avanza la practica:

- Tabla de endpoints con respuestas correctas y de error
- Politica de parametros de consulta desconocidos
- Ubicacion del contenido estatico y por que
- Por que el filtrado se hace en el servidor
- Diferencia entre PUT y PATCH, y cual usa el cliente al editar

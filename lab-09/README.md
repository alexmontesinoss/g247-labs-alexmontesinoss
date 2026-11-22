# Laboratorio 9 — Hooks en la practica: carga, exito y error

Alejandro Montesinos — usuario de GitHub: `alexmontesinoss` — modalidad: **individual**

Continua el proyecto React del laboratorio 8 y le anade dos listas que se traen
sus datos de una API: `UserList` y `PostList`. La lista de partidos del
laboratorio 8 sigue ahi, para que se vea la diferencia entre un componente que
recibe los datos por props y uno que va a buscarlos el solo.

## Como se ejecuta

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.example` **si** se sube al repositorio: es la plantilla y no lleva ningun
secreto. `.env.local` **no** se sube; lo ignora la regla `*.local` del
`.gitignore`. Las variables de entorno solo se leen **al arrancar**, asi que si
se cambia el fichero hay que parar y volver a arrancar `npm run dev`.

## Los componentes

| Fichero | Que hace | De donde saca los datos |
|---|---|---|
| `src/App.jsx` | Monta las tres listas | el array de partidos lo tiene el |
| `src/List.jsx` + `src/Item.jsx` | Los partidos del laboratorio 8 | de las props que le pasa `App` |
| `src/UserList.jsx` | Diez usuarios | de la API, el solo |
| `src/PostList.jsx` | Diez publicaciones | de la API, el solo |
| `src/api.js` | El cliente de Axios | — |

## El patron de los tres estados

```jsx
const [users, setUsers]     = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError]     = useState(null);
```

Hacen falta los tres. Con menos no se puede distinguir **estoy esperando** de
**no hay nada** de **ha fallado**, y el usuario se queda mirando una pagina en
blanco sin saber si esperar o recargar.

**Por que la peticion va dentro de `useEffect`:** el cuerpo del componente se
ejecuta en cada repintado. Si la peticion estuviera suelta ahi, la respuesta
llamaria a `setUsers`, eso obligaria a repintar, y al repintar se volveria a
pedir: un bucle infinito. El `[]` del final significa «una sola vez, al
aparecer el componente».

**Por que la funcion del efecto no es `async`:** un efecto puede devolver una
funcion de limpieza, y una funcion `async` devuelve siempre una promesa. La
funcion `async` se declara fuera y dentro del efecto solo se llama.

**Por que `finally`:** apaga la carga pase lo que pase. Si se apagara solo en
el `try`, un fallo dejaria el «Cargando...» puesto para siempre.

**Por que `setError(null)` al empezar:** si no se limpiara, al pulsar Refresh
despues de un fallo seguiria viendose el mensaje viejo aunque esta vez fuera
bien.

## Cuantas publicaciones se muestran, y por que

**Se muestran diez**, y se piden **diez al servidor** con `?_limit=10` en vez de
traerse las cien y tirar noventa: la respuesta pasa de 26,9 KB a 2,7 KB, y
recortar donde estan los datos es siempre mas barato que recortar despues de
haberlos descargado.

## Las dos listas son independientes

Cada componente tiene sus propios `loading` y `error`, asi que las dos
peticiones van por su cuenta: si se cae la de las publicaciones, los usuarios se
siguen viendo igual, y al reves.

## Un aviso del linter

`npm run lint` saca un aviso —no un error— en `UserList.jsx` y `PostList.jsx`:
`react(set-state-in-effect)`. Se queja de que `loadUsers()` llama a
`setLoading(true)` nada mas entrar en el efecto, lo cual la primera vez es
redundante porque `loading` ya vale `true` de salida. Se deja asi porque el
enunciado pide expresamente que la funcion «active la carga», y porque esa
llamada si hace falta cuando se pulsa Refresh.

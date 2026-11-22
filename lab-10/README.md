# Laboratorio 10 — Routing y estado global

Alejandro Montesinos — usuario de GitHub: `alexmontesinoss` — modalidad: **individual**

Continua el proyecto de los laboratorios 8 y 9 y lo convierte en una **SPA**
(aplicacion de una sola pagina): cinco rutas, contexto de autenticacion, rutas
protegidas y carga de datos por identificador. Reutiliza el cliente de Axios
`src/api.js` del laboratorio 9.

## Como se ejecuta

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.example` se sube al repositorio; `.env.local` no, porque lo ignora la
regla `*.local` del `.gitignore`.

## Las cinco rutas

| Ruta | Pagina | Protegida |
|---|---|---|
| `/` | `Home` | no |
| `/login` | `Login` | no |
| `/users` | `UsersList` | no |
| `/users/:id` | `UserDetail` | **si** |
| `/settings` | `Settings` | **si** |

## Los ficheros

| Fichero | Que hace |
|---|---|
| `src/main.jsx` | Envuelve la aplicacion: `BrowserRouter` → `AuthProvider` → `App` |
| `src/App.jsx` | El menu, las cinco rutas y el componente `Protected` |
| `src/AuthContext.jsx` | El contexto de sesion y el hook `useAuth()` |
| `src/pages.jsx` | Las cinco paginas |
| `src/api.js` | El cliente de Axios del laboratorio 9, con `getUser(id)` anadida |

## Por que la dependencia del efecto es `[id]` y no `[]`

El array de dependencias de `useEffect` le dice a React **cuando** tiene que
volver a ejecutar el efecto: cuando alguno de esos valores haya cambiado
respecto a la vez anterior.

Con `[]` el efecto se ejecutaria **una sola vez**, al montar el componente. Y
ahi esta el problema: al navegar de `/users/3` a `/users/7`, React **no desmonta
`UserDetail` para montar otro**, porque es el mismo componente en la misma ruta;
lo unico que cambia es el valor de `id`. Como la lista de dependencias estaria
vacia, React no veria ningun motivo para repetir el efecto, la peticion no se
volveria a lanzar, y seguirias viendo en pantalla los datos del usuario 3
mientras la barra de direcciones dice 7. La pantalla y la URL contarian cosas
distintas, que es justo lo que no puede pasar.

Con `[id]`, en cuanto cambia el identificador React vuelve a lanzar el efecto y
pide el usuario correcto. La regla general: **en las dependencias va todo lo que
el efecto lee de fuera y puede cambiar**.

## El acceso es simulado

JSONPlaceholder no tiene autenticacion, asi que no hay ninguna llamada a un
servidor: `signIn` se inventa un token y lo guarda. Lo dice el enunciado
expresamente. El JWT de verdad, con bcrypt, firma y caducidad, es el del
laboratorio 7.

El token se guarda **en dos sitios a la vez** y cada uno sirve para una cosa:
en `localStorage` para que la sesion siga ahi despues de recargar, y en el
estado de React para que la pantalla se entere y repinte el menu. Con solo
`localStorage` el menu no cambiaria hasta recargar; con solo el estado, la
sesion se perderia al pulsar F5.

## Dos decisiones que conviene explicar

**`<Navigate to="/login" replace />`.** El `replace` sustituye la entrada en el
historial en vez de anadir una nueva. Sin el, el boton «atras» devolveria a la
ruta protegida, que redirigiria otra vez a `/login`, y el usuario se quedaria
atrapado sin poder retroceder.

**El filtro de `UsersList` vive en `UsersList`.** Lo usan dos cosas, la casilla
donde se escribe y la lista que se filtra, asi que el estado tiene que estar en
el antecesor comun mas cercano a las dos. La lista filtrada **no** es otro
estado: se calcula a partir del texto en cada repintado, porque guardarla seria
duplicar informacion.

## Un aviso del linter

`npm run lint` saca un aviso —no un error— en `AuthContext.jsx`:
`react(only-export-components)`, porque ese fichero exporta un componente
(`AuthProvider`) y ademas un hook (`useAuth`). Esta asi porque es la estructura
que da la plantilla del enunciado.

# Laboratorio 8 — Primeros componentes React

Alejandro Montesinos — usuario de GitHub: `alexmontesinoss` — modalidad: **individual**

Proyecto creado con **Vite** y la plantilla de React. Monta el arbol de
componentes `App -> List -> Item` y lo aplica a **mi trayectoria deportiva**,
que es el tema que vengo usando desde el laboratorio 1 y en la practica 1:
cinco partidos de verdad, de futbol, tenis, baloncesto y padel.

## Como se ejecuta

```bash
npm install
npm run dev
```

Vite dice en la terminal en que direccion se ha abierto (normalmente
`http://localhost:5173`).

## Los tres componentes

| Fichero | Que hace | Que recibe |
|---|---|---|
| `src/App.jsx` | Guarda el array y pinta el titulo | nada |
| `src/List.jsx` | Recorre el array y crea un `Item` por elemento | la prop `items` |
| `src/Item.jsx` | Pinta un partido en un `<li>` | la prop `item` |

Cada partido tiene `id`, `rival`, `puntos`, `ganado`, `deporte` y `temporada`.

**Donde vive el array:** en `App.jsx`. `List` e `Item` no lo conocen; solo
reciben lo que `App` les manda hacia abajo por las props.

**Como llega a `Item`:** `App` le pasa el array entero a `List` con
`<List items={items} />`. `List` lo recorre con `.map()` y a cada `Item` le
pasa **un solo elemento** con `<Item item={item} />`.

**Para que sirve `key`:** no es para mi, es para React. Cuando la lista cambia,
React compara la de antes con la de ahora, y la `key` es lo que le permite
saber que fila es cual. Sin ella no sabe si una fila se ha movido, se ha
borrado o es nueva. Se usa `item.id` porque es unico y no cambia; la posicion
del array no valdria, porque al borrar el primero cambiarian todas las demas.

## El contador

El contador esta en **`App.jsx`**, y es el **unico** de los tres componentes
que usa `useState`.

```jsx
const [count, setCount] = useState(0);
...
<button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
```

`useState(0)` devuelve dos cosas: el valor que tiene ahora el estado (`count`)
y la unica forma de cambiarlo (`setCount`). No se puede hacer `count = count + 1`
a mano: React no se enteraria y la pantalla no cambiaria. Al llamar a `setCount`,
React vuelve a ejecutar el componente y repinta lo que haga falta.

El `onClick` recibe **una funcion**, no el resultado de llamarla. Por eso va
`() => setCount(...)`: sin la flecha se ejecutaria al pintar la pagina en vez
de al pulsar.

### La pregunta del enunciado

> Si el contador se situa dentro de `Item`, cuantos contadores independientes existen?

**Cinco, uno por cada partido de la lista**, porque el estado pertenece a cada
copia del componente y no al componente en si: `Item` se dibuja cinco veces y
cada una se guarda su propio `count`, asi que pulsar el boton de una fila no
cambiaria el numero de las otras cuatro.

## Que se ha cambiado de lo que crea Vite

- `src/App.jsx` vaciado y escrito de cero.
- `src/App.css` borrado, y su importacion retirada.
- Borradas las imagenes del ejemplo de Vite, que ya no se usan.
- `src/main.jsx` **sin tocar**, como pide el enunciado.

# Laboratorio 8 — Primeros componentes React

Alejandro Montesinos — usuario de GitHub: `alexmontesinoss` — modalidad: **individual**

Proyecto creado con **Vite** y la plantilla de React. Monta el arbol de
componentes `App -> List -> Item`.

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
| `src/Item.jsx` | Pinta un elemento en un `<li>` | la prop `item` |

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

## Que se ha cambiado de lo que crea Vite

- `src/App.jsx` vaciado y escrito de cero.
- `src/App.css` borrado, y su importacion retirada.
- Borradas las imagenes del ejemplo de Vite, que ya no se usan.
- `src/main.jsx` **sin tocar**, como pide el enunciado.

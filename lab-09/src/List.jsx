/*
  src/List.jsx — Laboratorio 8, primera parte

  List no tiene datos propios: recibe el array por la prop "items" y se
  encarga de dibujar la lista. Si manana cambian los datos, este fichero
  no se toca.
*/

import Item from "./Item.jsx";

// { items } saca directamente la prop del objeto que React le pasa.
// Seria lo mismo que escribir (props) y luego usar props.items.
export default function List({ items }) {
  return (
    <ul>
      {/*
        .map() recorre el array y devuelve UN <Item /> por cada elemento.
        Es el mismo .map() de siempre; lo unico nuevo es que lo que sale
        son componentes en vez de numeros o textos.

        key es obligatoria. No es para mi: es para React. Cuando la lista
        cambia, React compara la de antes con la de ahora, y la key es lo
        que le permite saber que fila es cual. Sin ella no sabe si una fila
        se ha movido, se ha borrado o es nueva, y acaba repintando de mas o
        mezclando el estado de unas filas con otras.

        Uso item.id porque es unico y no cambia. La posicion del array no
        valdria: si se borra el primero, todos los demas cambiarian de key.
      */}
      {items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </ul>
  );
}

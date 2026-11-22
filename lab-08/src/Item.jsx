/*
  src/Item.jsx — Laboratorio 8, primera parte

  Item es el ultimo de la cadena. Recibe UN elemento por la prop "item" y
  lo pinta. No sabe nada de la lista entera ni de donde salen los datos.

  Las props no se tocan: un componente nunca modifica lo que le dan. Los
  datos bajan; si hay que cambiar algo, se avisa hacia arriba.
*/

export default function Item({ item }) {
  return (
    <li>
      {/* Dos campos del objeto. Las llaves meten el valor dentro del HTML. */}
      <strong>{item.title}</strong> — {item.subtitle}
    </li>
  );
}

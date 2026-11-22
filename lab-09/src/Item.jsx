/*
  src/Item.jsx — Laboratorio 8, segunda parte

  Item es el ultimo de la cadena. Recibe UN partido por la prop "item" y lo
  pinta. No sabe nada de la lista entera ni de donde salen los datos.

  Las props no se tocan: un componente nunca modifica lo que le dan. Los
  datos bajan; si hay que cambiar algo, se avisa hacia arriba.
*/

export default function Item({ item }) {
  return (
    <li>
      <strong>{item.rival}</strong> — {item.deporte}, temporada {item.temporada}
      {" · "}
      {item.puntos} puntos
      {" · "}
      {/*
        Un if normal no cabe dentro del JSX, asi que para elegir entre dos
        valores se usa el operador ternario: condicion ? siVerdad : siFalso.
      */}
      {item.ganado ? "ganado" : "perdido"}
    </li>
  );
}

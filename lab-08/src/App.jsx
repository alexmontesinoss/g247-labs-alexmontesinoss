/*
  src/App.jsx — Laboratorio 8, primera parte
  Programacion de Aplicaciones Web (G247) · CUNEF EPS

  App es el componente de arriba del todo. Es quien TIENE los datos, y los
  va pasando hacia abajo: App -> List -> Item.

  Un componente es una funcion que empieza por MAYUSCULA y devuelve JSX.
  Se usa escribiendo <App />, nunca llamandola como App().
*/

import List from "./List.jsx";

export default function App() {
  // El array vive AQUI, en App. Los otros dos componentes no lo conocen:
  // solo reciben lo que App les manda. Cada elemento lleva un id unico,
  // que es lo que List usara como key.
  const items = [
    { id: 1, title: "Futbol", subtitle: "Deporte de equipo, 11 jugadores" },
    { id: 2, title: "Tenis", subtitle: "Individual o dobles" },
    { id: 3, title: "Baloncesto", subtitle: "Deporte de equipo, 5 jugadores" },
    { id: 4, title: "Padel", subtitle: "Siempre en parejas" },
    { id: 5, title: "Atletismo", subtitle: "Carreras, saltos y lanzamientos" },
  ];

  return (
    <main>
      <h1>Mis deportes</h1>

      {/*
        Esto es pasar una prop: el array sale de App y entra en List con el
        nombre "items". Las llaves hacen falta porque dentro va una
        expresion de JavaScript y no un texto.
      */}
      <List items={items} />
    </main>
  );
}

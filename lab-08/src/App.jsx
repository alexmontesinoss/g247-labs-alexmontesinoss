/*
  src/App.jsx — Laboratorio 8, segunda parte
  Programacion de Aplicaciones Web (G247) · CUNEF EPS

  App es el componente de arriba del todo. Es quien TIENE los datos, y los
  va pasando hacia abajo: App -> List -> Item.

  Un componente es una funcion que empieza por MAYUSCULA y devuelve JSX.
  Se usa escribiendo <App />, nunca llamandola como App().

  Los datos son cinco partidos de verdad de mi trayectoria deportiva, que es
  el tema que vengo usando desde el laboratorio 1 y en la practica 1.
*/

import { useState } from "react";
import List from "./List.jsx";

export default function App() {
  // El array vive AQUI, en App. Los otros dos componentes no lo conocen:
  // solo reciben lo que App les manda. Cada partido lleva un id unico, que
  // es lo que List usara como key.
  const partidos = [
    { id: 1, rival: "Algete C.F.",           puntos: 2,  ganado: true,  deporte: "futbol",     temporada: "2015-16" },
    { id: 2, rival: "Cobena C.D.",           puntos: 1,  ganado: false, deporte: "futbol",     temporada: "2018-19" },
    { id: 3, rival: "Pablo Marin",           puntos: 18, ganado: true,  deporte: "tenis",      temporada: "2023-24" },
    { id: 4, rival: "Annandale High School", puntos: 41, ganado: false, deporte: "baloncesto", temporada: "2024-25" },
    { id: 5, rival: "Javi y Marcos",         puntos: 11, ganado: true,  deporte: "padel",      temporada: "2025-26" },
  ];

  /*
    EL CONTADOR. Esta en App y solo en App: es el unico componente de los
    tres que usa useState.

    useState(0) devuelve dos cosas en un array:
      - count    : el valor que tiene ahora el estado
      - setCount : la unica forma de cambiarlo

    Y aqui esta la idea importante de React: NO se puede hacer count = count + 1.
    Hay que llamar a setCount. Cambiar la variable a mano no serviria de nada,
    porque React no se enteraria y la pantalla no cambiaria. Al llamar a
    setCount, React vuelve a ejecutar este componente y repinta lo que haga
    falta, y solo lo que haga falta.
  */
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1>Mis partidos</h1>

      {/*
        onClick recibe UNA FUNCION, no el resultado de llamarla. Por eso va
        () => setCount(...) y no setCount(...) a secas: si lo escribiera sin
        la flecha, se ejecutaria al pintar la pagina en vez de al pulsar, y
        ademas entraria en un bucle infinito de repintados.
      */}
      <button onClick={() => setCount(count + 1)}>
        Clicked {count} times
      </button>

      {/*
        Esto es pasar una prop: el array sale de App y entra en List con el
        nombre "items". Las llaves hacen falta porque dentro va una expresion
        de JavaScript y no un texto.
      */}
      <List items={partidos} />
    </main>
  );
}

/*
  src/UserList.jsx — Laboratorio 9, primera parte

  El patron de siempre para pintar datos que vienen de una API. Son TRES
  estados, y hacen falta los tres:

    users    los datos cuando han llegado
    loading  si hay una peticion en marcha
    error    que ha fallado, si es que ha fallado

  Con menos de tres no se puede distinguir "estoy esperando" de "no hay nada"
  de "ha reventado", y el usuario se queda mirando una pagina en blanco sin
  saber si esperar o recargar.
*/

import { useEffect, useState } from "react";
import { getUsers } from "./api.js";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadUsers() {
    // Al empezar: enciendo la carga y borro el error anterior. Lo del error
    // importa: si no lo limpiara, al reintentar despues de un fallo seguiria
    // viendose el mensaje viejo aunque esta vez saliera bien.
    setLoading(true);
    setError(null);

    try {
      const datos = await getUsers();
      setUsers(datos);
    } catch (fallo) {
      // Aqui entran dos cosas distintas: que el servidor conteste mal (404,
      // 500...) y que no se pueda ni llegar a el (sin red, direccion mal).
      // Axios, al contrario que fetch, lanza en los dos casos; con fetch
      // habria que mirar response.ok a mano.
      setError("No se han podido cargar los usuarios.");
      console.error(fallo);
    } finally {
      // finally se ejecuta pase lo que pase, haya salido bien o mal. Si
      // apagara la carga solo en el try, un fallo dejaria el "Cargando..."
      // puesto para siempre.
      setLoading(false);
    }
  }

  /*
    useEffect con [] al final = "ejecuta esto UNA VEZ, cuando el componente
    aparece en pantalla".

    Por que la peticion va aqui y no suelta en el cuerpo del componente:
    el cuerpo se ejecuta en cada repintado. Como la respuesta llama a
    setUsers, y setUsers obliga a repintar, se pediria otra vez, y otra, y
    otra: un bucle infinito de peticiones.

    Y fijate en que la funcion del efecto NO es async. Un efecto puede
    devolver una funcion de limpieza, y una funcion async devuelve siempre
    una promesa; React se liaria. Por eso se declara la funcion async fuera
    y aqui solo se llama.
  */
  useEffect(() => {
    loadUsers();
  }, []);

  // Solo UNA de las tres ramas se pinta. El return corta: si esta cargando,
  // no se llega a mirar el error ni la lista.
  if (loading) {
    return <p>Cargando usuarios...</p>;
  }

  if (error) {
    return (
      <div>
        <p role="alert">{error}</p>
        {/* El boton tiene que seguir estando tras un fallo: si no, la unica
            salida seria recargar la pagina entera. */}
        <button onClick={loadUsers} disabled={loading}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={loadUsers} disabled={loading}>
        Refresh
      </button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <strong>{user.name}</strong> — {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

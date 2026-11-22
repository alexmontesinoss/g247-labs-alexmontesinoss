/*
  src/AuthContext.jsx — Laboratorio 10, primera parte

  El contexto resuelve un problema concreto: "si hay sesion o no" lo
  necesitan sitios muy separados del arbol (el menu, la proteccion de rutas,
  la pagina de ajustes). Pasarlo por props obligaria a que cada componente
  intermedio lo fuese cargando aunque no lo use. Eso se llama perforar props,
  y el contexto es justo lo que lo evita.

  OJO: este acceso es SIMULADO. JSONPlaceholder no tiene autenticacion, asi
  que no hay ninguna llamada a un servidor: el token se lo inventa el propio
  navegador. El JWT de verdad, con bcrypt y firma, es el del laboratorio 7 y
  el de la practica 2.
*/

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /*
    El valor inicial se lee de localStorage, no se pone a null.

    Por que: localStorage sobrevive a recargar la pagina y a cerrar el
    navegador; el estado de React no, porque vive en memoria y se pierde al
    recargar. Si arrancara en null, al pulsar F5 pareceria que te has salido.

    useState(valor) solo mira ese valor la PRIMERA vez que se monta el
    componente; en los repintados siguientes se queda con lo que tenga.
  */
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  async function signIn(email, password) {
    // Validacion minima: sin correo o sin contrasena no se entra.
    // Lanzo en vez de devolver false para que el formulario lo recoja en su
    // catch, que es como se manejan los errores en codigo async.
    if (!email || !password) {
      throw new Error("Hacen falta el correo y la contrasena.");
    }

    // Aqui iria la llamada al servidor. Como no hay servidor, me invento un
    // token. Es una simulacion y esta dicho expresamente en el enunciado.
    const simulado = "token-simulado-" + Date.now();

    // Se guarda en los dos sitios a la vez, y cada uno sirve para una cosa:
    //   localStorage -> para que la sesion siga ahi despues de recargar
    //   el estado    -> para que React se entere y repinte el menu
    // Solo con localStorage, la pantalla no cambiaria hasta recargar.
    localStorage.setItem("token", simulado);
    setToken(simulado);
  }

  function signOut() {
    localStorage.removeItem("token");
    setToken(null);
  }

  // Boolean(token) convierte el texto (o el null) en true/false. Asi quien
  // use el contexto no ve nunca el token: solo si hay sesion o no.
  const value = { isLoggedIn: Boolean(token), signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Un hook propio: en vez de que cada componente importe AuthContext y llame
// a useContext, llaman a useAuth(). Si manana cambia como se guarda la
// sesion, se cambia aqui y los componentes no se enteran.
export const useAuth = () => useContext(AuthContext);

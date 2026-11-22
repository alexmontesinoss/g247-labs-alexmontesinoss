/*
  src/App.jsx — Laboratorio 10, primera parte

  App ya no pinta contenido: lo que hace es decidir QUE pagina se pinta
  segun la URL. Eso es una SPA (aplicacion de una sola pagina): el navegador
  descarga la pagina una vez y, a partir de ahi, cambiar de seccion no pide
  nada al servidor, solo cambia lo que React dibuja.
*/

import { Routes, Route, Link, Navigate } from "react-router";
import { useAuth } from "./AuthContext.jsx";
import { Home, Login, UsersList, UserDetail, Settings } from "./pages.jsx";

/*
  Protected es un componente que envuelve a otro y decide si dejarlo pasar.
  Si no hay sesion devuelve <Navigate>, que no pinta nada: lo que hace es
  cambiar la ruta.

  replace sustituye la entrada en el historial del navegador en vez de
  anadir una nueva. Sin replace, el boton "atras" te devolveria a la ruta
  protegida, que volveria a redirigir a /login, y te quedarias atrapado en
  un bucle sin poder retroceder.
*/
function Protected({ children }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { isLoggedIn, signOut } = useAuth();

  return (
    <>
      {/*
        Link no es un <a> normal. Un <a> pediria la pagina entera al
        servidor y recargaria todo; Link solo cambia la URL y le dice a
        React que pinte otra cosa. Por eso navegar es instantaneo.
      */}
      <nav>
        <Link to="/">Home</Link>{" | "}
        <Link to="/users">Users</Link>{" | "}
        <Link to="/settings">Settings</Link>{" | "}
        {isLoggedIn ? (
          <button onClick={signOut}>Salir</button>
        ) : (
          <Link to="/login">Entrar</Link>
        )}
      </nav>

      {/*
        Routes mira la URL y pinta la PRIMERA Route que encaja. Las cinco
        rutas que pide el enunciado:
      */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/users" element={<UsersList />} />

        {/*
          Los dos puntos de ":id" marcan un trozo variable: /users/3 y
          /users/7 encajan los dos, y UserDetail lee el numero con
          useParams(). Va protegida igual que /settings: el mismo Protected
          sirve para las dos, porque envuelve a lo que le pongas dentro.
        */}
        <Route
          path="/users/:id"
          element={
            <Protected>
              <UserDetail />
            </Protected>
          }
        />

        <Route
          path="/settings"
          element={
            <Protected>
              <Settings />
            </Protected>
          }
        />
      </Routes>
    </>
  );
}

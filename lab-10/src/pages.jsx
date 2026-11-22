/*
  src/pages.jsx — Laboratorio 10
  Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Las cinco paginas. En un proyecto de verdad cada una iria en su fichero
  dentro de src/pages/; aqui van juntas porque asi lo da el profesor y se
  lee de una sentada.
*/

import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useAuth } from "./AuthContext.jsx";

// ---------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------
export function Home() {
  return (
    <section>
      <h1>Home</h1>
      <p>Click the nav links above to explore the app.</p>
    </section>
  );
}

// ---------------------------------------------------------------------
// Login — acceso simulado con correo y contrasena.
// ---------------------------------------------------------------------
export function Login() {
  const { signIn } = useAuth();

  // useNavigate sirve para cambiar de ruta DESDE EL CODIGO, no con un clic.
  // Aqui hace falta porque la redireccion ocurre despues de que el envio
  // del formulario haya ido bien.
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    // Sin esto el navegador recargaria la pagina al enviar el formulario,
    // que es lo que hacian las webs antes. Es el mismo preventDefault de la
    // practica 1.
    e.preventDefault();
    setError("");

    try {
      await signIn(email, password);
      navigate("/settings");
    } catch (fallo) {
      // signIn lanza si falta algun campo; el mensaje se pinta debajo.
      setError(fallo.message);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Login</h1>
      {/*
        Estos campos son "controlados": el valor que se ve en pantalla sale
        del estado, y cada tecla llama a setEmail. React es la unica fuente
        de la verdad; el input no guarda nada por su cuenta.
      */}
      <label>Email: <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Password: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <button type="submit">Entrar</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

// ---------------------------------------------------------------------
// UsersList — filtro con el estado elevado.
// ---------------------------------------------------------------------
const USERS = [
  { id: 1, name: "Ada Lovelace" },
  { id: 2, name: "Alan Turing" },
  { id: 3, name: "Grace Hopper" },
  { id: 4, name: "Edsger Dijkstra" },
  { id: 5, name: "Barbara Liskov" },
];

export function UsersList() {
  /*
    ESTADO ELEVADO. El texto del filtro lo usan DOS cosas: la casilla donde
    se escribe y la lista que se filtra. Si cada una tuviera su propio
    estado, no se enterarian la una de la otra.

    La regla: el estado compartido vive en el ANTECESOR COMUN mas cercano.
    Aqui ese antecesor es UsersList, asi que el estado va aqui y baja por
    props a quien lo necesite.
  */
  const [q, setQ] = useState("");

  // La lista filtrada NO es otro estado: se calcula a partir de q en cada
  // repintado. Guardarla como estado seria duplicar informacion, y tendria
  // que acordarme de actualizarla cada vez que cambia q.
  const filtered = USERS.filter((u) =>
    u.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section>
      <h1>Users</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter..." />
      <ul>
        {filtered.map((u) => (
          <li key={u.id}>
            <Link to={`/users/${u.id}`}>{u.name}</Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p>Nadie coincide con el filtro.</p>}
    </section>
  );
}

// ---------------------------------------------------------------------
// UserDetail — primera parte: solo ensenar el id de la URL.
// ---------------------------------------------------------------------
export function UserDetail() {
  // useParams lee los trozos variables de la ruta. Como la ruta se declaro
  // como "/users/:id", aqui llega { id: "3" } al visitar /users/3.
  // Y llega como TEXTO, porque en una URL todo es texto.
  const { id } = useParams();

  return <h1>User {id}</h1>;
}

// ---------------------------------------------------------------------
// Settings — ruta protegida.
// ---------------------------------------------------------------------
export function Settings() {
  const { isLoggedIn } = useAuth();
  return <section><h1>Settings</h1><p>{isLoggedIn ? "Session active" : "No session"}</p></section>;
}

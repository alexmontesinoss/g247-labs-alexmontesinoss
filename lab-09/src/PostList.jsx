/*
  src/PostList.jsx — Laboratorio 9, segunda parte

  El mismo patron que UserList, contra otro endpoint: tres estados (datos,
  carga y error), la peticion dentro de useEffect, y una sola rama pintada
  cada vez.

  Las dos listas son INDEPENDIENTES. Cada componente tiene sus propios
  estados, asi que si se cae la peticion de las publicaciones, los usuarios
  se siguen viendo igual, y al reves. No comparten nada.
*/

import { useEffect, useState } from "react";
import { getPosts } from "./api.js";

// Cuantas publicaciones pido. Esta aqui arriba y con nombre para que se vea
// que es una decision y no un numero suelto perdido en el codigo.
const CUANTAS = 10;

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadPosts() {
    setLoading(true);
    setError(null);

    try {
      const datos = await getPosts(CUANTAS);
      setPosts(datos);
    } catch (fallo) {
      setError("No se han podido cargar las publicaciones.");
      console.error(fallo);
    } finally {
      setLoading(false);
    }
  }

  // [] = una sola vez, al aparecer el componente. La funcion del efecto no
  // es async a proposito: se declara fuera y aqui solo se llama.
  useEffect(() => {
    loadPosts();
  }, []);

  if (loading) {
    return <p>Cargando publicaciones...</p>;
  }

  if (error) {
    return (
      <div>
        <p role="alert">{error}</p>
        <button onClick={loadPosts} disabled={loading}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={loadPosts} disabled={loading}>
        Refresh
      </button>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <strong>{post.title}</strong>
            <p>{post.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

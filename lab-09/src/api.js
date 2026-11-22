/*
  src/api.js — Laboratorio 9
  Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Un unico cliente de Axios para toda la aplicacion. Los componentes llaman a
  getUsers() o getPosts() y no saben ni contra que servidor van: si manana
  cambia la direccion, se cambia aqui y en ningun sitio mas.

  Es la misma idea que el store.js de la practica 1 o el tasksModel del
  laboratorio 6: una capa que aisla de donde salen los datos.
*/

import axios from "axios";

// import.meta.env es como Vite entrega las variables de entorno al navegador.
// Solo deja pasar las que empiezan por VITE_, justamente para que no se cuele
// sin querer una contrasena del servidor dentro del paquete que se descarga
// el usuario.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Axios devuelve un objeto con muchas cosas (status, headers, config...).
// Al componente solo le interesan los datos, asi que devuelvo response.data
// y me quedo el resto aqui.
export async function getUsers() {
  const response = await api.get("/users");
  return response.data;
}

export async function getPosts() {
  const response = await api.get("/posts");
  return response.data;
}

export default api;

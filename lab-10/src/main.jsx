/*
  src/main.jsx — Laboratorio 10
  Plantilla del profesor, sin cambios.

  El orden de las tres envolturas importa, y es de fuera hacia dentro:

    BrowserRouter   es quien sabe en que URL estamos
      AuthProvider  es quien sabe si hay sesion
        App         es quien decide que pintar segun las dos cosas

  AuthProvider va DENTRO de BrowserRouter porque la proteccion de rutas
  necesita poder redirigir, y redirigir es cosa del router.
*/

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./AuthContext.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider><App /></AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

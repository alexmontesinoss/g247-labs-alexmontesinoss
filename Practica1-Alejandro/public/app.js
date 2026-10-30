/*
  public/app.js
  Practica 1 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  Este fichero se ejecuta en el NAVEGADOR, no en el servidor. Habla con la
  API por fetch() y pinta el resultado. La pagina no se recarga nunca.

  JavaScript a secas: ni React, ni jQuery, ni nada.

  Lo importante de aqui:
    - Filtrar, ordenar y paginar los hace EL SERVIDOR. Nosotros solo
      montamos la URL con los parametros y pedimos.
    - Comprobamos SIEMPRE response.ok antes de fiarnos de la respuesta.
    - Los errores del 400 se pintan debajo de su campo, uno por uno.
*/

// ---------- ATAJOS ----------
const $ = (id) => document.getElementById(id);

const POR_PAGINA = 5;

// Lo unico que recordamos entre pantallas.
let paginaActual = 0;        // cuantas paginas llevamos saltadas
let totalFiltrados = 0;      // cuantos hay con los filtros puestos
let editandoId = null;       // null = estamos creando; un numero = editando

// ---------- AVISOS ----------

function mostrarCargando(si) {
  $("cargando").hidden = !si;
}

function mostrarError(mensaje) {
  const aviso = $("aviso-error");
  if (mensaje) {
    aviso.textContent = mensaje;
    aviso.hidden = false;
  } else {
    aviso.textContent = "";
    aviso.hidden = true;
  }
}

// Borra los mensajes de error de todos los campos del formulario.
function limpiarErroresCampos() {
  const campos = ["rival", "puntos", "ganado", "deporte", "temporada", "body"];
  for (const campo of campos) {
    const hueco = $("error-" + campo);
    if (hueco) {
      hueco.textContent = "";
    }
    const entrada = $("campo-" + campo);
    if (entrada) {
      entrada.removeAttribute("aria-invalid");
    }
  }
}

// Pinta la lista de errores que manda la API, cada uno bajo su campo.
function pintarErroresCampos(errores) {
  limpiarErroresCampos();

  for (const error of errores) {
    const hueco = $("error-" + error.field);
    if (hueco) {
      hueco.textContent = error.message;
    } else {
      // Un campo que no tenemos en el formulario: lo mandamos al aviso general.
      mostrarError(error.message);
    }

    const entrada = $("campo-" + error.field);
    if (entrada) {
      entrada.setAttribute("aria-invalid", "true");
    }
  }
}

// ---------- HABLAR CON LA API ----------

/*
  Envoltorio de fetch. Devuelve { ok, datos, total }.
  Si la respuesta no es ok, lanza un error con la lista de campos dentro
  cuando la API ha mandado una, para poder pintarla en el formulario.
*/
async function pedir(url, opciones) {
  const respuesta = await fetch(url, opciones);

  // 204 No Content: ha ido bien pero no hay cuerpo que leer.
  if (respuesta.status === 204) {
    return { datos: null, total: 0 };
  }

  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null; // la respuesta no traia JSON
  }

  if (!respuesta.ok) {
    const fallo = new Error("La peticion ha fallado");
    fallo.status = respuesta.status;
    fallo.errores = cuerpo && Array.isArray(cuerpo.errors) ? cuerpo.errors : null;
    fallo.mensaje = cuerpo && cuerpo.error ? cuerpo.error : null;
    throw fallo;
  }

  const total = Number(respuesta.headers.get("X-Total-Count"));

  return {
    datos: cuerpo,
    total: Number.isInteger(total) ? total : 0,
  };
}

// Monta la URL con todos los filtros que haya puestos.
function construirUrl() {
  const parametros = new URLSearchParams();

  const busqueda = $("filtro-busqueda").value.trim();
  if (busqueda !== "") {
    parametros.set("search", busqueda);
  }

  const deporte = $("filtro-deporte").value;
  if (deporte !== "") {
    parametros.set("deporte", deporte);
  }

  const resultado = $("filtro-resultado").value;
  if (resultado !== "") {
    parametros.set("ganado", resultado);
  }

  // El desplegable guarda "campo|direccion" en un solo valor.
  const [campo, direccion] = $("filtro-orden").value.split("|");
  parametros.set("sort", campo);
  parametros.set("order", direccion);

  parametros.set("limit", String(POR_PAGINA));
  parametros.set("offset", String(paginaActual * POR_PAGINA));

  return "/partidos?" + parametros.toString();
}

// ---------- PINTAR ----------

const NOMBRE_DEPORTE = {
  futbol: "Fútbol",
  tenis: "Tenis",
  baloncesto: "Baloncesto",
  padel: "Pádel",
};

function crearFila(partido) {
  const fila = document.createElement("li");
  fila.className = "partido " + (partido.ganado ? "partido--ganado" : "partido--perdido");

  // --- nombre del rival ---
  const rival = document.createElement("span");
  rival.className = "partido__rival";
  // textContent, no innerHTML: si alguien guarda un rival con etiquetas
  // dentro, se ve como texto y no se ejecuta.
  rival.textContent = partido.rival;

  // --- etiquetas con los datos ---
  const datos = document.createElement("span");
  datos.className = "partido__datos";

  const resultado = document.createElement("span");
  resultado.className = "etiqueta " + (partido.ganado ? "etiqueta--ganado" : "etiqueta--perdido");
  resultado.textContent = partido.ganado ? "Ganado" : "Perdido";

  const deporte = document.createElement("span");
  deporte.className = "etiqueta";
  deporte.textContent = NOMBRE_DEPORTE[partido.deporte] || partido.deporte;

  const puntos = document.createElement("span");
  puntos.className = "etiqueta";
  puntos.textContent = partido.puntos + " pts";

  datos.append(resultado, deporte, puntos);

  if (partido.temporada) {
    const temporada = document.createElement("span");
    temporada.className = "etiqueta";
    temporada.textContent = partido.temporada;
    datos.append(temporada);
  }

  // --- botones ---
  const acciones = document.createElement("span");
  acciones.className = "partido__acciones";

  const girar = document.createElement("button");
  girar.type = "button";
  girar.className = "boton boton--pequeno";
  girar.textContent = partido.ganado ? "Marcar perdido" : "Marcar ganado";
  girar.addEventListener("click", () => cambiarResultado(partido));

  const editar = document.createElement("button");
  editar.type = "button";
  editar.className = "boton boton--pequeno";
  editar.textContent = "Editar";
  editar.addEventListener("click", () => empezarEdicion(partido));

  const borrar = document.createElement("button");
  borrar.type = "button";
  borrar.className = "boton boton--pequeno boton--peligro";
  borrar.textContent = "Borrar";
  borrar.addEventListener("click", () => borrarPartido(partido));

  acciones.append(girar, editar, borrar);
  fila.append(rival, datos, acciones);

  return fila;
}

function pintarLista(partidos) {
  const lista = $("partidos");
  lista.textContent = ""; // vaciar lo anterior

  for (const partido of partidos) {
    lista.append(crearFila(partido));
  }

  $("vacio").hidden = partidos.length > 0;
}

function pintarPaginacion() {
  const paginas = Math.ceil(totalFiltrados / POR_PAGINA);

  $("paginacion").hidden = paginas <= 1;
  $("pagina-actual").textContent = `Página ${paginaActual + 1} de ${paginas}`;
  $("boton-anterior").disabled = paginaActual === 0;
  $("boton-siguiente").disabled = paginaActual >= paginas - 1;
}

function pintarContador(enPantalla) {
  if (totalFiltrados === 0) {
    $("contador").textContent = "";
  } else {
    $("contador").textContent = `Mostrando ${enPantalla} de ${totalFiltrados}`;
  }
}

// ---------- CARGAR ----------

async function cargarPartidos() {
  mostrarError("");
  mostrarCargando(true);

  try {
    const { datos, total } = await pedir(construirUrl());
    totalFiltrados = total;

    // Si borramos el ultimo de una pagina, esa pagina deja de existir:
    // retrocedemos una y volvemos a pedir.
    if (datos.length === 0 && paginaActual > 0) {
      paginaActual--;
      mostrarCargando(false);
      return cargarPartidos();
    }

    pintarLista(datos);
    pintarContador(datos.length);
    pintarPaginacion();
  } catch (fallo) {
    pintarLista([]);
    $("vacio").hidden = true;
    $("paginacion").hidden = true;
    $("contador").textContent = "";
    mostrarError("No se han podido cargar los partidos. ¿Está el servidor encendido?");
  } finally {
    // finally se ejecuta pase lo que pase, asi que el "Cargando…"
    // siempre se apaga, tanto si va bien como si falla.
    mostrarCargando(false);
  }
}

async function cargarStats() {
  try {
    const { datos } = await pedir("/partidos/stats");
    $("stat-total").textContent = datos.total;
    $("stat-ganados").textContent = datos.ganados;
    $("stat-porcentaje").textContent = datos.porcentajeVictorias + "%";
    $("stat-puntos").textContent = datos.puntosTotales;
  } catch {
    // Las estadisticas son un extra: si fallan, la pagina sigue
    // funcionando y no le damos la brasa al usuario.
    $("stat-total").textContent = "—";
    $("stat-ganados").textContent = "—";
    $("stat-porcentaje").textContent = "—";
    $("stat-puntos").textContent = "—";
  }
}

async function refrescar() {
  await cargarPartidos();
  await cargarStats();
}

// ---------- FORMULARIO ----------

// Lee el formulario y lo convierte en un partido.
function leerFormulario() {
  const temporada = $("campo-temporada").value.trim();
  const puntos = $("campo-puntos").value.trim();

  return {
    rival: $("campo-rival").value.trim(),
    // Number("") da 0, que colaria como valido: por eso el vacio lo
    // dejamos en undefined y que lo rechace el validador.
    puntos: puntos === "" ? undefined : Number(puntos),
    ganado: $("campo-ganado").checked,
    deporte: $("campo-deporte").value,
    temporada: temporada === "" ? null : temporada,
  };
}

/*
  Validacion en el cliente ANTES de mandar nada. Repite las reglas del
  servidor a proposito: el servidor valida igual y es el que manda, pero
  asi el usuario ve el fallo al momento y nos ahorramos un viaje.
*/
function validarEnCliente(partido) {
  const errores = [];

  if (partido.rival.length < 2 || partido.rival.length > 80) {
    errores.push({ field: "rival", message: "El rival debe tener entre 2 y 80 caracteres." });
  }

  if (partido.puntos === undefined || Number.isNaN(partido.puntos)) {
    errores.push({ field: "puntos", message: "Los puntos son obligatorios." });
  } else if (!Number.isInteger(partido.puntos)) {
    errores.push({ field: "puntos", message: "Los puntos deben ser un numero entero." });
  } else if (partido.puntos < 0 || partido.puntos > 200) {
    errores.push({ field: "puntos", message: "Los puntos deben estar entre 0 y 200." });
  }

  if (partido.deporte === "") {
    errores.push({ field: "deporte", message: "Elige un deporte." });
  }

  if (partido.temporada !== null) {
    const bien =
      partido.temporada.length === 7 &&
      partido.temporada[4] === "-" &&
      !Number.isNaN(Number(partido.temporada.slice(0, 4))) &&
      !Number.isNaN(Number(partido.temporada.slice(5)));

    if (!bien) {
      errores.push({
        field: "temporada",
        message: "La temporada debe tener el formato AAAA-AA, por ejemplo 2018-19.",
      });
    }
  }

  return errores;
}

function vaciarFormulario() {
  $("formulario").reset();
  $("campo-id").value = "";
  editandoId = null;
  limpiarErroresCampos();

  $("titulo-form").textContent = "Añadir un partido";
  $("boton-guardar").textContent = "Añadir partido";
  $("boton-cancelar").hidden = true;
}

function empezarEdicion(partido) {
  editandoId = partido.id;

  $("campo-id").value = partido.id;
  $("campo-rival").value = partido.rival;
  $("campo-puntos").value = partido.puntos;
  $("campo-ganado").checked = partido.ganado;
  $("campo-deporte").value = partido.deporte;
  $("campo-temporada").value = partido.temporada || "";

  limpiarErroresCampos();
  $("titulo-form").textContent = "Editar el partido contra " + partido.rival;
  $("boton-guardar").textContent = "Guardar cambios";
  $("boton-cancelar").hidden = false;

  $("campo-rival").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function enviarFormulario(evento) {
  evento.preventDefault(); // sin esto el navegador recargaria la pagina

  mostrarError("");
  const partido = leerFormulario();

  const erroresLocales = validarEnCliente(partido);
  if (erroresLocales.length > 0) {
    pintarErroresCampos(erroresLocales);
    return; // ni siquiera llamamos a la API
  }

  limpiarErroresCampos();
  $("boton-guardar").disabled = true;

  // Editando usamos PUT porque el formulario trae el partido ENTERO,
  // asi que lo sustituimos del todo. El boton de "marcar ganado/perdido"
  // usa PATCH, porque ese solo cambia un campo.
  const editando = editandoId !== null;
  const url = editando ? `/partidos/${editandoId}` : "/partidos";
  const metodo = editando ? "PUT" : "POST";

  try {
    await pedir(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partido),
    });

    vaciarFormulario();
    await refrescar();
  } catch (fallo) {
    if (fallo.errores) {
      // La API ha dicho exactamente que campos estan mal: los pintamos.
      pintarErroresCampos(fallo.errores);
    } else if (fallo.status === 404) {
      mostrarError("Ese partido ya no existe. Alguien lo ha borrado.");
      vaciarFormulario();
      await refrescar();
    } else {
      mostrarError("No se ha podido guardar. Inténtalo otra vez.");
    }
  } finally {
    $("boton-guardar").disabled = false;
  }
}

// ---------- ACCIONES DE CADA FILA ----------

// Solo cambia un campo, asi que PATCH.
async function cambiarResultado(partido) {
  mostrarError("");

  try {
    await pedir(`/partidos/${partido.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ganado: !partido.ganado }),
    });
    await refrescar();
  } catch {
    mostrarError("No se ha podido cambiar el resultado.");
  }
}

async function borrarPartido(partido) {
  if (!window.confirm(`¿Seguro que quieres borrar el partido contra ${partido.rival}?`)) {
    return;
  }

  mostrarError("");

  try {
    await pedir(`/partidos/${partido.id}`, { method: "DELETE" });

    // Si estabamos editando justo ese, vaciamos el formulario.
    if (editandoId === partido.id) {
      vaciarFormulario();
    }
    await refrescar();
  } catch (fallo) {
    if (fallo.status === 404) {
      mostrarError("Ese partido ya no estaba.");
      await refrescar();
    } else {
      mostrarError("No se ha podido borrar.");
    }
  }
}

// ---------- ESCUCHAR LA PAGINA ----------

// Al cambiar cualquier filtro volvemos a la primera pagina: si estabas en
// la pagina 3 y filtras, puede que ya no haya pagina 3.
function alCambiarFiltro() {
  paginaActual = 0;
  cargarPartidos();
}

/*
  La busqueda espera a que dejes de teclear. Sin esto se lanzaria una
  peticion por cada letra: "Algete" serian seis.
*/
let temporizador = null;
function alEscribirBusqueda() {
  clearTimeout(temporizador);
  temporizador = setTimeout(alCambiarFiltro, 300);
}

$("formulario").addEventListener("submit", enviarFormulario);
$("boton-cancelar").addEventListener("click", vaciarFormulario);

$("filtro-busqueda").addEventListener("input", alEscribirBusqueda);
$("filtro-deporte").addEventListener("change", alCambiarFiltro);
$("filtro-resultado").addEventListener("change", alCambiarFiltro);
$("filtro-orden").addEventListener("change", alCambiarFiltro);

$("boton-anterior").addEventListener("click", () => {
  if (paginaActual > 0) {
    paginaActual--;
    cargarPartidos();
  }
});

$("boton-siguiente").addEventListener("click", () => {
  if ((paginaActual + 1) * POR_PAGINA < totalFiltrados) {
    paginaActual++;
    cargarPartidos();
  }
});

// ---------- ARRANQUE ----------
refrescar();

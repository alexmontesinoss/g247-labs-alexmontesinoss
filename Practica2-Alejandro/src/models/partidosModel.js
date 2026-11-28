/*
  src/models/partidosModel.js
  Practica 2 · Programacion de Aplicaciones Web (G247) · CUNEF EPS

  El recurso de la Practica 1, ahora contra PostgreSQL.

  LA DIFERENCIA GRANDE CON LA P1: alli el servidor se traia los 14 partidos a
  memoria y los filtraba con .filter(), los ordenaba con .sort() y los cortaba
  con .slice(). Aqui todo eso lo hace la base de datos con WHERE, ORDER BY,
  LIMIT y OFFSET, y solo viajan las filas que se van a usar. Con 14 partidos
  daba igual; con una tabla de verdad, filtrar en JavaScript obliga a
  descargarla entera en cada peticion para tirar casi todo.

  Factoria con la base de datos inyectada: lo unico que le exige a "db" es
  query(texto, parametros).

  REGLA DE ORO: los valores van SIEMPRE como parametros ($1, $2, ...). Nunca
  se construye SQL pegando texto que venga de fuera.
*/

/*
  La unica excepcion a esa regla, y hay que entender por que:

  El nombre de una columna NO se puede mandar como parametro. "ORDER BY $1"
  no ordena por esa columna: PostgreSQL lo entiende como ordenar por una
  constante, porque un parametro es un VALOR, no un trozo de consulta.

  Asi que el campo por el que se ordena si acaba pegado en el texto del SQL.
  Para que eso no sea un agujero, no se pega lo que llegue por la URL: se
  comprueba contra esta lista blanca y, si no esta, se usa el orden por
  defecto. Lo que se concatena sale siempre de aqui, nunca del usuario.
*/
const COLUMNAS_ORDENABLES = {
  id: "p.id",
  rival: "p.rival",
  puntos: "p.puntos",
  deporte: "p.deporte",
  temporada: "p.temporada",
  fecha: "p.created_at",
};

const ORDEN_POR_DEFECTO = "p.id";

// Las columnas que se devuelven, siempre las mismas. Se escriben a mano en
// vez de usar SELECT *, para que anadir una columna a la tabla no cambie sin
// querer lo que ve el cliente.
const CAMPOS = `
  p.id,
  p.user_id,
  p.rival,
  p.puntos,
  p.ganado,
  p.deporte,
  p.temporada,
  p.created_at,
  u.email AS owner_email
`;

/*
  Construye el trozo WHERE a partir de los filtros, y la lista de valores que
  lo acompana.

  Se monta en un array y se une con AND al final. Asi da igual cuantos
  filtros vengan: si no viene ninguno, el WHERE se queda vacio.

  Los $1, $2... se numeran segun van entrando, por eso se lleva la cuenta con
  valores.length: el hueco siguiente es siempre el numero de valores que ya
  hay mas uno.
*/
function construirFiltros(filtros = {}) {
  const condiciones = [];
  const valores = [];

  const hueco = () => "$" + (valores.length + 1);

  // Busqueda por nombre del rival. ILIKE es LIKE sin distinguir mayusculas,
  // y los % de alrededor significan "que lo contenga en cualquier posicion".
  // El texto del usuario viaja como parametro: los % los pone el servidor.
  if (typeof filtros.search === "string" && filtros.search.trim() !== "") {
    condiciones.push(`p.rival ILIKE ${hueco()}`);
    valores.push("%" + filtros.search.trim() + "%");
  }

  if (typeof filtros.deporte === "string" && filtros.deporte.trim() !== "") {
    condiciones.push(`p.deporte = ${hueco()}`);
    valores.push(filtros.deporte.trim());
  }

  // ganado llega como texto desde la URL ("true"/"false"), nunca como
  // booleano. Cualquier otro valor se ignora en vez de filtrar mal.
  if (filtros.ganado === "true" || filtros.ganado === true) {
    condiciones.push(`p.ganado = TRUE`);
  } else if (filtros.ganado === "false" || filtros.ganado === false) {
    condiciones.push(`p.ganado = FALSE`);
  }

  if (typeof filtros.temporada === "string" && filtros.temporada.trim() !== "") {
    condiciones.push(`p.temporada = ${hueco()}`);
    valores.push(filtros.temporada.trim());
  }

  // Filtro por propietario. No lo pide el cliente por la URL: lo pone el
  // controlador cuando hace falta limitar el alcance.
  if (filtros.userId !== undefined && filtros.userId !== null) {
    condiciones.push(`p.user_id = ${hueco()}`);
    valores.push(filtros.userId);
  }

  const where = condiciones.length > 0 ? "WHERE " + condiciones.join(" AND ") : "";
  return { where, valores };
}

function construirOrden(sort, order) {
  const columna = COLUMNAS_ORDENABLES[sort] || ORDEN_POR_DEFECTO;
  const direccion = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";

  /*
    NULLS LAST: en PostgreSQL los NULL se ponen los primeros al ordenar
    descendente, y los ultimos al ascendente. Como temporada puede ser NULL,
    sin esto el orden cambiaria de sitio los partidos sin temporada segun la
    direccion. Que queden siempre al final es mas predecible.

    Y el desempate por id: si dos partidos tienen el mismo deporte, sin un
    segundo criterio PostgreSQL no promete en que orden los devuelve, y dos
    paginas seguidas podrian repetir o saltarse filas.
  */
  return `ORDER BY ${columna} ${direccion} NULLS LAST, p.id ASC`;
}

function createPartidosModel(db) {
  return {
    /*
      El listado. Devuelve { total, items }:
        total -> cuantos hay DESPUES de filtrar y ANTES de paginar
        items -> solo la pagina pedida

      Son dos consultas con el mismo WHERE. Hace falta contar aparte porque
      la consulta de las filas lleva LIMIT, y entonces COUNT(*) contaria solo
      las de la pagina, no el total. El cliente necesita el total para saber
      cuantas paginas pintar.
    */
    async findAll({ limit = 20, offset = 0, sort, order, ...filtros } = {}) {
      const { where, valores } = construirFiltros(filtros);

      const conteo = await db.query(
        `SELECT COUNT(*)::int AS total
         FROM partidos p
         JOIN users u ON u.id = p.user_id
         ${where}`,
        valores
      );

      const filas = await db.query(
        `SELECT ${CAMPOS}
         FROM partidos p
         JOIN users u ON u.id = p.user_id
         ${where}
         ${construirOrden(sort, order)}
         LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
        [...valores, limit, offset]
      );

      return { total: conteo.rows[0].total, items: filas.rows };
    },

    // Un partido por su id, o null. El controlador lo usa para contestar 404
    // y para mirar de quien es antes de dejar tocarlo.
    async findById(id) {
      const { rows } = await db.query(
        `SELECT ${CAMPOS}
         FROM partidos p
         JOIN users u ON u.id = p.user_id
         WHERE p.id = $1`,
        [id]
      );
      return rows[0] ?? null;
    },

    // La consulta paginada por propietario que pide el enunciado. Es findAll
    // con el filtro de dueno ya puesto.
    async findByOwner(userId, { limit = 20, offset = 0, sort, order, ...filtros } = {}) {
      return this.findAll({ ...filtros, userId, limit, offset, sort, order });
    },

    async create({ rival, puntos, ganado, deporte, temporada = null, userId }) {
      const { rows } = await db.query(
        `INSERT INTO partidos (user_id, rival, puntos, ganado, deporte, temporada)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [userId, rival, puntos, ganado, deporte, temporada]
      );
      // Se relee para devolverlo con el correo del dueno, igual que el resto.
      return this.findById(rows[0].id);
    },

    /*
      PUT: sustitucion entera. Los seis campos se escriben siempre, asi que
      lo que no venga vuelve a su valor por defecto. El dueno no se toca: un
      PUT cambia el contenido del partido, no a quien pertenece.
    */
    async replace(id, { rival, puntos, ganado, deporte, temporada = null }) {
      const { rows } = await db.query(
        `UPDATE partidos
         SET rival = $2, puntos = $3, ganado = $4, deporte = $5, temporada = $6
         WHERE id = $1
         RETURNING id`,
        [id, rival, puntos, ganado, deporte, temporada]
      );
      if (rows.length === 0) return null;
      return this.findById(id);
    },

    /*
      PATCH: solo cambia lo que llega. COALESCE(a, b) se queda con el primero
      que no sea NULL, asi que un campo que no mando viaja como NULL y la
      columna se queda como estaba.

      Ojo con "?? null" en vez de "|| null": ?? solo salta con null y
      undefined, mientras que || saltaria tambien con false y con 0. Como
      ganado es booleano y puntos puede valer 0, con || seria imposible
      marcar un partido como perdido o ponerle cero puntos.

      Y temporada tiene su propia bandera: con COALESCE a secas no habria
      forma de BORRAR la temporada, porque mandar null significa "no lo
      cambies". La bandera distingue "no lo mando" de "ponlo a null".
    */
    async patch(id, campos) {
      const borrarTemporada =
        Object.prototype.hasOwnProperty.call(campos, "temporada") && campos.temporada === null;

      const { rows } = await db.query(
        `UPDATE partidos
         SET rival     = COALESCE($2, rival),
             puntos    = COALESCE($3, puntos),
             ganado    = COALESCE($4, ganado),
             deporte   = COALESCE($5, deporte),
             temporada = CASE WHEN $7 THEN NULL ELSE COALESCE($6, temporada) END
         WHERE id = $1
         RETURNING id`,
        [
          id,
          campos.rival ?? null,
          campos.puntos ?? null,
          campos.ganado ?? null,
          campos.deporte ?? null,
          campos.temporada ?? null,
          borrarTemporada,
        ]
      );
      if (rows.length === 0) return null;
      return this.findById(id);
    },

    // Devuelve true si habia algo que borrar y false si no, para que el
    // controlador conteste 204 o 404.
    async remove(id) {
      const resultado = await db.query(`DELETE FROM partidos WHERE id = $1 RETURNING id`, [id]);
      return resultado.rowCount > 0;
    },

    /*
      /stats. En la P1 esto se calculaba en JavaScript recorriendo el array;
      aqui lo calcula PostgreSQL de una pasada.

      FILTER (WHERE ...) cuenta solo las filas que cumplen la condicion, sin
      tener que hacer una consulta aparte por cada cifra.

      Los cuidados con el cero son los mismos que en la P1: si no hay
      partidos, COUNT da 0 y las medias darian division por cero. Por eso
      NULLIF(COUNT(*), 0), que convierte el 0 en NULL y hace que la division
      devuelva NULL en vez de reventar; el COALESCE de fuera lo pasa a 0.
    */
    async stats(filtros = {}) {
      const { where, valores } = construirFiltros(filtros);

      const { rows } = await db.query(
        `SELECT
           COUNT(*)::int                                            AS total,
           COUNT(*) FILTER (WHERE p.ganado)::int                    AS ganados,
           COUNT(*) FILTER (WHERE NOT p.ganado)::int                AS perdidos,
           COALESCE(ROUND(
             100.0 * COUNT(*) FILTER (WHERE p.ganado) / NULLIF(COUNT(*), 0)
           ), 0)::int                                               AS porcentaje_victorias,
           COALESCE(SUM(p.puntos), 0)::int                          AS puntos_totales,
           COALESCE(ROUND(AVG(p.puntos)::numeric, 1), 0)::float     AS puntos_por_partido
         FROM partidos p
         JOIN users u ON u.id = p.user_id
         ${where}`,
        valores
      );

      return rows[0];
    },

    /*
      LA CONSULTA AGREGADA PROPIA que pide el enunciado.

      Resumen por deporte: cuantos partidos, cuantos ganados, el porcentaje de
      victorias y el mejor resultado de cada uno, ordenado de mas jugado a
      menos. Es un GROUP BY de verdad, con agregados y desempate.

      Responde a algo que no contesta ninguna otra ruta: "en que deporte se me
      da mejor". /stats da el total global; esto lo parte por deporte.
    */
    async resumenPorDeporte(filtros = {}) {
      const { where, valores } = construirFiltros(filtros);

      const { rows } = await db.query(
        `SELECT
           p.deporte,
           COUNT(*)::int                             AS partidos,
           COUNT(*) FILTER (WHERE p.ganado)::int     AS ganados,
           ROUND(
             100.0 * COUNT(*) FILTER (WHERE p.ganado) / COUNT(*)
           )::int                                    AS porcentaje_victorias,
           MAX(p.puntos)::int                        AS mejor_marca
         FROM partidos p
         JOIN users u ON u.id = p.user_id
         ${where}
         GROUP BY p.deporte
         ORDER BY partidos DESC, p.deporte ASC`,
        valores
      );

      return rows;
    },
  };
}

module.exports = { createPartidosModel, COLUMNAS_ORDENABLES };

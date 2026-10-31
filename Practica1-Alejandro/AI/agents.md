# Agente de IA — tester de caja negra

Práctica 1 · Programación de Aplicaciones Web (G247) · CUNEF EPS
Alejandro Montesinos · modalidad individual

Este documento recoge la configuración del único agente de la práctica, el contrato que recibió y las comprobaciones que generó. El juicio crítico sobre sus resultados está en [review-log.md](review-log.md).

---

## 1. Qué agente y para qué

Un **tester de caja negra**. Su trabajo es intentar romper la API usando únicamente lo que promete la documentación, igual que haría alguien que se encuentra el README y la URL y no tiene el código delante.

La razón de que sea de caja negra no es estética. Si el agente ve la implementación, acaba escribiendo pruebas que comprueban *lo que el código hace*, no *lo que el contrato promete*. Y los fallos interesantes están justo en la diferencia entre esas dos cosas.

## 2. Condiciones de ejecución

| | |
|---|---|
| **Fecha** | 30 de octubre de 2026 |
| **API bajo prueba** | `http://localhost:3100`, una segunda instancia del mismo servidor levantada con `PORT=3100 node src/server.js` |
| **Estado inicial** | los 14 partidos de `src/data/store.js` |
| **Herramientas permitidas** | `curl`, y órdenes cortas de shell o Node solo para dar formato al JSON recibido |
| **Herramientas prohibidas** | cualquier lectura de ficheros, búsqueda en el repositorio o acceso al código |

Se usó una instancia aparte en el puerto 3100 para que el agente pudiera crear y borrar partidos libremente sin tocar la del 3000. Como el almacén está en memoria, todo lo que escribió desapareció al reiniciar el proceso.

## 3. Prompt del agente

> Eres un tester de API de caja negra. Estás probando una API REST que corre en `http://localhost:3100`.
>
> **RESTRICCIONES FIRMES — definen el ejercicio, no las incumplas:**
> - No tienes acceso a la implementación. **No** leas, abras, busques ni listes **ningún** fichero, carpeta ni repositorio de esta máquina.
> - Tu único uso permitido de herramientas es `curl` contra `http://localhost:3100`, más órdenes cortas de shell o Node para dar formato o comparar el JSON que devuelve curl.
> - Todo lo que sabes de la API está en el contrato de más abajo. Si algo no está en el contrato, trata tu expectativa como una inferencia y dilo.
>
> Tu trabajo: diseñar y ejecutar comprobaciones HTTP de caja negra que verifiquen si la API en ejecución respeta de verdad el contrato. Prueba los límites y los casos raros, no solo el camino feliz. Ten en cuenta que el almacén es en memoria y tus escrituras persisten mientras viva el proceso.
>
> Informa, en español:
> 1. Una lista numerada de cada comprobación: la orden `curl` exacta, el resultado esperado según el contrato y el resultado real.
> 2. Una lista separada de **DISCREPANCIAS**: sitios donde la API no coincide con el contrato, o donde el contrato calla y el comportamiento podría sorprender a un cliente. Para cada una, severidad (alta / media / baja) y cómo reproducirla exactamente.
> 3. Lo que no hayas podido verificar desde fuera, y por qué.
>
> Sé adversario y concreto. No rellenes el informe con comprobaciones que pasan de forma trivial, pero enuméralas de forma compacta para que se vea la cobertura. No especules sobre detalles de implementación: informa solo de comportamiento observable.
>
> `=== CONTRATO ===` *(el documento completo de la sección 4)* `=== FIN DEL CONTRATO ===`

## 4. Contrato entregado

El agente recibió exactamente la información que el README publica: la forma del recurso, la tabla de reglas de cada campo, la tabla de endpoints, los parámetros de consulta con su política, el ejemplo de `/stats`, el formato de los errores, la diferencia entre PUT y PATCH y la ubicación del contenido estático.

No recibió nada más. Ni rutas de ficheros, ni nombres de módulos, ni versiones de dependencias, ni el código.

## 5. Comprobaciones generadas

El agente diseñó y ejecutó **124 comprobaciones**, agrupadas así:

| Grupo | Nº | Qué cubre |
|---|---|---|
| Salud, lectura y 404 | 1–15 | `/health`, listado, 404 de recurso y de ruta, métodos no soportados, `OPTIONS`, contenido estático, intento de salida del directorio con `%2e%2e` |
| Identificador en la ruta | 16–26 | `abc`, `3.5`, `3abc`, `-1`, `0`, un entero enorme, `03`, `1e1`, barra final, mayúsculas, y si `/stats` se puede borrar |
| Filtros | 27–41 | `search` parcial y sin distinguir mayúsculas, que no se interprete como expresión regular, filtros exactos, valores inválidos, parámetros desconocidos, `__proto__`, parámetros como array y repetidos |
| Ordenación | 42–50 | asc/desc, campos no admitidos, mayúsculas en `order`, posición de los `null`, estabilidad ante empates |
| Paginación | 51–61 | `limit`, `offset`, valores negativos, decimales y no numéricos, el tope de 100, el orden filtrar→ordenar→paginar y la cabecera `X-Total-Count` |
| Creación y validación | 62–93 | `201` y `Location`, `id` del cliente ignorado, campos desconocidos, los límites exactos de cada campo, espacios, emojis, tipos equivocados, JSON roto, JSON que no es objeto, cuerpo de 2 MB, inyección de HTML y 10 POST en paralelo |
| PUT, PATCH y DELETE | 94–114 | sustitución entera, validación parcial, 404 antes que 400, campos extra, `204` sin cuerpo, doble borrado y reutilización de ids |
| Estadísticas | 115–124 | recálculo en cada petición, filtros aplicados, conjunto vacío, redondeos y coherencia con `X-Total-Count` |

## 6. Resultado

El agente encontró **14 discrepancias**: 3 de severidad alta, 2 media y 9 baja.

Tras verificarlas una por una (ver [review-log.md](review-log.md)):

- **5 se aceptaron como fallos reales y están corregidas**, con pruebas automáticas que impiden que vuelvan: `tests/agente.test.js`.
- **9 se rechazaron como fallos**, por ser comportamiento deliberado, comportamiento por defecto de Express sin riesgo, o huecos de documentación. De estas, las que eran huecos reales se han documentado en el README.

Además, el agente señaló **7 afirmaciones del contrato que no se pueden verificar desde fuera**, lo cual es una observación correcta y útil: están recogidas al final del review-log.

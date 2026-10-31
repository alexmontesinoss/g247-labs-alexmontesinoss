# Revisión crítica del agente

Práctica 1 · Programación de Aplicaciones Web (G247) · CUNEF EPS
Alejandro Montesinos · 30 de octubre de 2026

La configuración del agente y el contrato que recibió están en [agents.md](agents.md). Aquí está lo que hizo, qué se aceptó, qué se rechazó y por qué.

**Regla que me puse antes de empezar:** ningún hallazgo del agente entra en el código sin que yo lo haya reproducido a mano contra el servidor. Un agente que se equivoca lo hace con el mismo tono de seguridad que cuando acierta, así que el informe no vale como prueba de nada; vale como lista de sitios donde mirar.

---

## 1. Lo que se le pidió

Una sola tarea: probar la API desde fuera, con el contrato del README como única fuente, y devolver las comprobaciones ejecutadas, las discrepancias encontradas y lo que no pudiera verificarse desde fuera.

Se le prohibió expresamente leer el código. Se le levantó una segunda instancia en el puerto 3100 para que pudiera escribir sin estorbar.

## 2. Lo que devolvió

124 comprobaciones ejecutadas y 14 discrepancias, con severidad y pasos de reproducción para cada una. El informe era concreto y reproducible: cada hallazgo traía la orden `curl` exacta.

## 3. Verificación, uno por uno

### Aceptados y corregidos

#### D1 · `GET /partidos` cortaba la lista en 100 sin avisar — **alta**

**Qué dijo:** con más de 100 partidos, una petición sin `limit` devuelve solo 100, con `X-Total-Count` diciendo la verdad y nada en el cuerpo que indique que falta algo.

**Comprobado:** creé 95 partidos y pedí `/partidos` sin parámetros. Cabecera `X-Total-Count: 110`, cuerpo con 100 elementos. Confirmado.

**Por qué pasaba:** el tope de 100 se aplicaba también cuando el cliente no pedía ningún `limit`.

**Corregido:** sin `limit` se devuelve todo; el tope de 100 solo se aplica al `limit` que pide el cliente. Es el fallo más grave de los catorce, porque se pierden datos en silencio.

#### D2 · El `rival` se validaba recortado pero se guardaba sin recortar — **alta**

**Qué dijo:** la regla dice "entre 2 y 80 caracteres sin contar espacios de los extremos", pero el recorte solo se usaba para validar. Se podían guardar rivales de 84 caracteres.

**Comprobado:** `POST` con `"rival": "  AB  "` devolvía `"  AB  "`, seis caracteres. Confirmado, y también en `PUT` y `PATCH`.

**Corregido:** los textos se recortan antes de guardarse, no solo antes de validarse. El agente además señaló un efecto de segundo orden que yo no había visto: contamina `sort=rival`, porque un rival con espacios delante se ordena antes que todos los demás.

#### D3 · Un parámetro repetido desactivaba el filtro entero — **alta**

**Qué dijo:** `?deporte=tenis&deporte=padel` devolvía la colección completa en vez de filtrar.

**Comprobado:** `?deporte=tenis` daba `X-Total-Count: 3`; `?deporte=tenis&deporte=padel` daba 110. Confirmado.

**Discusión:** esto estuvo cerca de rechazarse. La política documentada es "los parámetros mal formados se ignoran", y un parámetro repetido es malformado, así que ignorarlo *cumple el contrato a la letra*. Lo que decidió el caso es el argumento del agente: ignorar un filtro no es neutral, porque devuelve **más** datos de los pedidos. Un cliente que filtra por un deporte y recibe todos no nota el fallo; simplemente enseña datos que creía descartados.

**Corregido:** si un parámetro llega repetido se usa el primer valor. El filtro sigue aplicándose.

#### D4 · La longitud del `rival` se medía en unidades UTF-16 — **media**

**Qué dijo:** un emoji (1 carácter) se aceptaba aunque el mínimo son 2, y 41 emojis (41 caracteres) se rechazaban aunque el máximo son 80.

**Comprobado:** confirmado en los dos sentidos, 201 y 400 respectivamente.

**Por qué pasaba:** `.length` en JavaScript cuenta unidades UTF-16, y un emoji ocupa dos.

**Corregido:** se mide con `[...texto].length`, que cuenta caracteres de verdad. Impacto real en esta aplicación: casi nulo, nadie va a llamar "🏀" a un rival. Se corrigió igual porque la regla del README decía "caracteres" y no era cierta, y una regla documentada que no se cumple es peor que una regla estricta.

#### D5 · El `:id` de la ruta se convertía en número en vez de validarse — **media**

**Qué dijo:** `/partidos/1e1` devolvía el partido **10**, porque `Number("1e1")` es 10. Y lo mismo afecta a `PUT`, `PATCH` y `DELETE`: se podía borrar un recurso distinto del que se pedía.

**Comprobado:** `/partidos/1e1` devolvía el partido 10. Confirmado. El punto sobre `DELETE` es correcto y es el que hace que esto importe.

**Corregido:** el `id` de la ruta tiene que ser solo dígitos; si no, 404.

**Lo que NO se aceptó de este hallazgo:** el agente metía en el mismo saco que `/partidos/03` devuelve el partido 3, marcándolo como ambiguo. Eso se ha dejado como está: `03` son todo dígitos y es el número 3 escrito con un cero delante. `1e1` es notación científica, que no es un identificador. Son casos distintos.

---

### Rechazados como fallo

#### D6 · Las rutas no distinguen mayúsculas — baja

`GET /PARTIDOS` devuelve la colección. **Comprobado:** cierto, responde 200.

**Rechazado.** Es el comportamiento por defecto de Express y el contrato no exige que las rutas distingan mayúsculas. No hay pérdida ni corrupción de datos: devuelve exactamente lo mismo que la ruta en minúsculas. Cambiarlo añadiría configuración que no resuelve ningún problema real.

#### D7 · Un cuerpo de 2 MB devuelve 413 con otro formato — baja

**Comprobado:** cierto, devuelve `413` con `{"error":"request entity too large"}` en vez del formato `{errors:[...]}`.

**Rechazado como fallo, aceptado como hueco de documentación.** El `413` es el código correcto, y la protección la pone `express.json()` antes de que nuestro código vea nada: es una defensa, no un descuido. Lo que sí faltaba era decirlo, así que el README ahora menciona el límite de tamaño del cuerpo.

#### D8 · `limit` inconsistente: `limit=101` se recorta pero `limit=abc` se ignora — baja

**Comprobado:** cierto. `limit=101` devuelve 100; `limit=abc` se ignora; `limit=0` devuelve lista vacía.

**Rechazado como fallo.** Las dos reglas son deliberadas y no se contradicen: un valor **malformado** se ignora, y un valor **válido pero por encima del máximo** se recorta al máximo. El agente tiene razón en que el contrato no lo distinguía, así que el README ahora lo dice con esas palabras, incluido qué significa `limit=0`.

#### D9 · `order=DESC` y `ganado=TRUE` se ignoran por las mayúsculas — baja

**Comprobado:** cierto, `order=DESC` ordena ascendente.

**Rechazado como fallo.** Es exactamente la política documentada: valor no reconocido, se ignora. Aceptar `DESC` obligaría a decidir también sobre `Desc`, `dEsC` y demás. El README ahora avisa de que los valores van en minúscula.

#### D10 · La ordenación de textos y la posición de los `null` no estaban especificadas — baja

**Comprobado:** cierto. `sort=rival` usa `localeCompare`, que no distingue mayúsculas y aplica reglas del idioma; los `null` van al final tanto en `asc` como en `desc`.

**Rechazado como fallo, aceptado como hueco de documentación.** Las dos decisiones son intencionadas: comparar nombres propios ignorando mayúsculas es lo que espera una persona, y un valor desconocido molesta menos al final. Ahora está escrito en el README.

#### D11 · `temporada: "2018-99"` se acepta — baja

**Comprobado:** cierto, devuelve 201.

**Rechazado.** El contrato pide el formato `AAAA-AA`, y `2018-99` lo cumple. Validar que el segundo número sea el año siguiente es una regla de negocio que nadie ha pedido y que rompería temporadas de año natural. Queda documentado que solo se valida el formato.

#### D12 · `/stats` con conjunto vacío y los redondeos — baja

**Comprobado:** cierto. Con 0 coincidencias devuelve todo a 0 y `porDeporte: {}`; el porcentaje se redondea a entero y la media a un decimal; `porDeporte` omite los deportes sin partidos.

**Rechazado como fallo.** Que no reviente con 0 elementos es justo lo que se buscaba: hay una comprobación explícita para no dividir entre cero. Que `porDeporte` omita los deportes vacíos es deliberado: es un recuento de lo que hay, no un formulario con todas las casillas. El ejemplo del README lista los cuatro deportes solo porque los cuatro tienen partidos. Los redondeos ahora están documentados.

#### D13 · `PATCH {"id": 555}` responde "hay que enviar al menos un campo" — baja

**Comprobado:** cierto.

**Rechazado.** Es el comportamiento correcto: el `id` no es modificable, así que un PATCH que solo trae un `id` no pide ningún cambio válido. El agente señala con razón que la redacción del contrato era ambigua, porque `id` sale en la tabla de campos. Corregida la redacción, no el código.

#### D14 · Un método no permitido devuelve 404 en vez de 405 — baja

**Comprobado:** cierto. `PUT /partidos` devuelve 404, aunque `OPTIONS /partidos` anuncia `Allow: GET, HEAD, POST`.

**Rechazado.** El contrato no promete `405` y Express responde 404 por defecto cuando ninguna ruta encaja. La observación es fina —el servidor se contradice un poco a sí mismo— pero implementar 405 obligaría a registrar manejadores para cada método no soportado de cada ruta, que es bastante código para un caso que ningún cliente real provoca.

---

## 4. Dónde se equivocó el agente

Tres cosas, y conviene dejarlas escritas porque son el motivo de no fiarse del informe sin comprobarlo:

1. **Números incoherentes dentro de su propio informe.** La comprobación 59 habla de "115 registros" y la discrepancia D1, que describe el mismo fallo, dice 135. El fallo era real, pero las cifras no cuadraban entre sí.

2. **Mezcló dos casos distintos en D5.** Juntó `1e1` (un fallo de verdad) con `03` (comportamiento razonable) bajo el mismo hallazgo. Si se acepta el hallazgo entero sin leerlo, se acaba rechazando ids perfectamente válidos.

3. **Trató el contrato silencioso como si fuera un defecto.** Nueve de sus catorce hallazgos no son fallos de la API sino sitios donde el README no decía nada. Es información útil —de hecho mejoró el README— pero presentarla como "discrepancia" con severidad asignada infla la lista y empuja a tocar código que está bien.

## 5. Dónde me equivoqué yo

Al escribir las pruebas de regresión puse mal dos expectativas, y lo descubrí al ejecutarlas, no al escribirlas:

- Di por hecho que `temporada: "  2020-21  "` se guardaría recortada. La API devolvía 400 porque el formato se validaba sin recortar. Decidí que lo coherente era recortar también la temporada antes de validar, así que el cambio acabó siendo del código, no de la prueba.
- Escribí una prueba que exigía 404 para `/partidos/03`, arrastrando el error del agente de mezclar ese caso con `1e1`. La prueba estaba mal, no el código.

## 6. Lo que no se puede verificar desde fuera

El agente lo identificó correctamente y merece quedar escrito, porque marca el límite de este tipo de prueba:

1. Que `/stats` se calcule en cada petición y no se guarde. Desde fuera, un cálculo al vuelo y una caché bien invalidada son indistinguibles.
2. Que el almacén sea en memoria y se reinicie con los 14 partidos. No puede reiniciar el proceso.
3. Que los campos desconocidos no se guarden. Solo comprueba que no aparecen en las respuestas; podrían estar guardados y no mostrarse.
4. Que no haya condiciones de carrera al generar ids. Diez peticiones en paralelo salieron con ids distintos, pero eso no demuestra que no pueda ocurrir.
5. El umbral exacto a partir del cual el cuerpo da 413.
6. El contenido de la página, el CSS y el JavaScript: solo verificó el código 200 y el `Content-Type`.
7. Por qué ocurren los comportamientos de D5 y D6. Describe lo observable y no especula sobre la implementación, que es lo que se le pidió.

## 7. Resultado

| | |
|---|---|
| Comprobaciones ejecutadas por el agente | 124 |
| Discrepancias señaladas | 14 |
| Reproducidas a mano antes de decidir | 14 |
| Aceptadas como fallo y corregidas | 5 |
| Rechazadas como fallo | 9 |
| De las rechazadas, documentadas en el README | 6 |
| Pruebas de regresión añadidas | 19, en `tests/agente.test.js` |
| Total de pruebas del proyecto | 92 |

Las 19 pruebas nuevas fallaban antes de los arreglos y pasan después. Esa es la comprobación de que los cinco fallos aceptados eran reales y están resueltos.

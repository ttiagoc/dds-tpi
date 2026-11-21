# Bitácora de uso de IA

Registro por sesión. Es la base de la conclusión del video: qué aportó la IA, qué hubo que corregir y qué se aprendió. Se completa con la skill `bitacora-ia`.

## Resumen acumulado

| Métrica | Valor |
|---|---|
| Sesiones | 18 |
| Features cerradas | 35 (It1 a It4 cerradas, It5b de rediseño, It5c de ajustes) |
| Correcciones relevantes a la IA | 7 |
| Skills creadas / mejoradas | 12 / 3 |

### Errores típicos de la IA (se actualiza)
1. Expectativas de test mal planteadas (un caso de búsqueda que daba por ausente un texto que sí estaba en el dato).
2. Invariantes incompletos al reconstruir entidades (ids repetidos, fechas sin validar, estado modificable desde afuera), detectados por la revisión con un subagente.
3. Repetición conceptual que ni las métricas ni la revisión de reglas detectaban, hasta que se incorporó una revisión de calidad específica.
4. Código que se aparta de la spec sin actualizarla (un método no previsto) y manejo de errores demasiado amplio (descartar cualquier error en lugar de solo los de autenticación).
5. Casos borde de la librería de validación que los tests no cubren: la conversión de un parámetro vacío a número da 0 y filtraba resultados sin aviso; lo detectó el subagente revisor, no los tests escritos por la misma IA.
6. Specs que contradicen una convención del propio repo (pedir que el controlador valide el cuerpo cuando la validación vive en el middleware de la ruta) y tests de integración que no verifican el orden de los middlewares de autorización y validación.
7. Diseños escritos en la spec que fallan en una configuración que los tests no ejercitan: el servidor de Socket.io se integró con Express de una forma que solo funcionaba por websocket, y los tests se conectaban únicamente por ese transporte.
8. Acciones fuera del alcance pedido y tests con dependencias inestables: formatear documentos de planificación que no correspondía tocar, y un test de hook que creaba la función a cargar en cada render, lo que disparaba recargas sin fin y colgaba la suite.
9. Nombres de archivo que solo difieren en mayúsculas de otro del mismo directorio (`accionesCompra.js` junto a `AccionesCompra.jsx`): en Windows la importación resolvía al archivo equivocado y rompió la suite; la IA lo detectó al correr los tests y lo renombró.
10. Tests que verifican el mecanismo interno y no el comportamiento: un test de limpieza contaba los oyentes registrados en el socket y siguió pasando ante un refactor que cambiaba cómo se registraban; se reescribió para comprobar que un evento posterior ya no llega.
11. Selectores e2e por prefijo que coinciden con elementos de otra pantalla: en la versión web, las pantallas inferiores de la pila siguen montadas, y un selector de tipo de entrada eligió el del detalle del evento, oculto debajo de la pantalla de compra. Se acotó a elementos visibles.
12. Verificaciones visuales sobre un servidor desactualizado: la versión web se levantó en modo CI, que no vigila los archivos, y las primeras capturas mostraban el código anterior al cambio; la IA lo detectó al comparar las capturas con lo implementado.
13. Cambios de contrato que no llegan a la validación: el contrato pasó a aceptar rutas relativas de imágenes, pero la validación del cuerpo seguía exigiendo URLs absolutas; los tests no cubrían el flujo real de subir una foto y publicar, y el error lo encontró el usuario en el celular.

---

## Sesión 1 — 2026-11-10 — Planificación inicial

- **Objetivo:** analizar la consigna, los repos de referencia (cátedra y TP grupal) y armar planes, skills, CLAUDE.md/AGENTS.md.
- **Herramienta / skill:** Claude Code (Opus) en modo plan; subagentes Explore para analizar los dos repos en paralelo; búsqueda web de skills externas.
- **Prompt (resumen):** "Hacé un plan de implementación del TP, preguntame lo necesario, armá skills (pantallas, diseño, endpoints), basate en el repo de cátedra y en el TP grupal".
- **Resultado:**
  - Extrajo el diagrama de clases embebido como imagen base64 en la consigna para poder leerlo.
  - Me hizo 13 preguntas de alcance (Expo, auth, estados, UI lib, lenguaje, tests, chat, evidencia, extras).
  - Generó 9 planes, 7 ADRs, 9 skills, 2 subagentes, AGENTS.md y CLAUDE.md.
- **Correcciones / decisiones mías:**
  - Pedí Cypress para e2e: la IA avisó que Cypress no corre apps nativas y propuso correrlo sobre Expo Web → aceptado (ADR-006).
  - La IA recomendaba polling para el chat; elegí Socket.io para aprender algo nuevo (ADR-005).
- **Tiempo:** ~1 h (estimo 4-6 h a mano para el mismo nivel de detalle).
- **Aprendizaje:** conviene fijar contratos de API y reglas de negocio por escrito antes de codear para que la IA no los invente; las skills sirven como "convenciones ejecutables".
- **Pendiente de validar:** reglas de dominio de `planes/02` (marcadas como propuesta) al escribir las specs.

## Sesión 2 — 2026-11-10 — Entorno de desarrollo

- **Objetivo:** dejar instaladas y verificadas las dependencias y las skills externas.
- **Avances:** backend con Express 5, Zod 4, JWT, Socket.io y Jest 30; frontend generado con Expo SDK 58 (expo-router, React Native Paper, soporte web) y test de humo con React Native Testing Library; ESLint, Prettier y Cypress en la raíz. Plugins de skills de Expo y Callstack habilitados a nivel proyecto.
- **Decisiones:**
  - Rutas del front en `src/app/`, convención de Expo SDK 58, en lugar de `app/` como estaba planificado — se adoptó la convención oficial del template.
  - ESLint 9 en lugar de 10 — `eslint-plugin-react` aún no soporta la versión 10.
  - Ejecución de Cypress mediante un script que limpia `ELECTRON_RUN_AS_NODE` — la variable, presente en las terminales de VS Code, impide iniciar Cypress.
  - gstack de uso selectivo (revisión, QA y seguridad), no como método general — evita superponer procesos y varias de sus skills suponen PRs y deploy, ajenos a este proyecto. Ver `planes/07`.

## Sesión 3 — 2026-11-10 — Revisión de planes e inicio de la Iteración 1

- **Objetivo:** revisar técnicamente los planes de arquitectura, dominio y API, e implementar la base del backend, el dominio y la persistencia en memoria.
- **Avances:**
  - Revisión de ingeniería de los planes 01, 02 y 03 (`/plan-eng-review`): se aplicaron diez correcciones (ADR-008).
  - Base del backend: aplicación Express testeable, manejo uniforme de errores, validación, entorno, reloj inyectable y contenedor de dependencias (spec 01).
  - Dominio completo con su máquina de estados y reglas de cupo, cancelación, reembolso y reseñas, con 99 % de cobertura (spec 02).
  - Repositorios en memoria, datos de demostración relativos a la fecha de arranque y reinicio de datos para pruebas end-to-end (spec 03).
  - Skill `revisar-calidad` y chequeo automático (`npm run calidad`: ESLint, Prettier y detección de duplicados), integrados al cierre de cada rama.
  - Spec de autenticación (spec 04) en borrador.
  - Suite del backend: 282 tests en verde.
- **Decisiones:**
  - Constructores de dominio que solo validan la forma y permiten reconstruir objetos, con las reglas que dependen de la fecha en métodos de creación — sin esto, los datos de demostración no podían incluir eventos pasados — propuesta de la IA en la revisión de planes, aceptada (ADR-008).
  - Reglas de cupo, reembolso, uso y plazo de cancelación confirmadas tal como estaban en el plan — reglas validadas explícitamente antes de codear — propuesta de la IA, aceptada sin cambios (ADR-007).
  - Datos de demostración con fechas relativas y un único conjunto para demo y tests — la demo no envejece y se evita mantener dos conjuntos — propuesta de la IA, aceptada.
  - Revisión de calidad obligatoria en cada cierre — la iniciativa fue mía, al notar que ni las métricas ni la revisión de reglas detectaban repetición; la IA diseñó la skill y su primera pasada encontró cinco problemas en código ya integrado, entre ellos códigos de error inconsistentes entre el log y la respuesta.
  - Mensajes de validación en castellano mediante el idioma español de zod — la IA detectó que los mensajes salían en inglés, en contra de las convenciones del proyecto (spec 04).
- **Aprendizaje:** la revisión con un segundo agente especializado (reglas de negocio o calidad) encontró problemas que los tests en verde no mostraban; conviene que forme parte del cierre de cada rama y no quede como paso opcional.

## Sesión 4 — 2026-11-10 — Autenticación, cierre de la Iteración 1 y especificación de eventos

- **Objetivo:** implementar la autenticación según la spec 04, cerrar la Iteración 1 y especificar la primera funcionalidad de la Iteración 2.
- **Avances:**
  - Autenticación con JWT desarrollada con TDD (tests en rojo antes de la implementación): inicio de sesión, recuperación de la sesión (`GET /auth/yo`), middlewares de autenticación obligatoria y opcional, y autorización por rol (spec 04).
  - Revisión de cierre con la skill de calidad y el subagente de reglas de negocio: sin hallazgos graves; se aplicaron cuatro de los siete hallazgos.
  - Iteración 1 cerrada: 333 tests en verde, cobertura del dominio del 99 %, inicio de sesión verificado contra el servidor real con usuarios de demostración; integración en `main` con la etiqueta `it1`.
  - Spec 05 de consulta de eventos (búsqueda, filtros, orden por fecha, precio y puntaje, paginado y detalle) aprobada.
- **Decisiones:**
  - Comparación de la contraseña contra un hash fijo cuando el email no existe — evita que el tiempo de respuesta revele qué emails están registrados, en línea con el mensaje único de credenciales inválidas — hallazgo del subagente revisor, aplicado con mi aprobación (spec 04, A1).
  - La autenticación opcional ignora solo los errores de autenticación y propaga los demás — antes, una falla del repositorio se trataba como usuario anónimo — hallazgo del subagente, aplicado.
  - El token usa el reloj del sistema y no el reloj inyectable — inyectarlo complicaba los tests de integración sin beneficio para el dominio — propuesta de la IA, aceptada y documentada en la spec.
  - Partición de la spec de eventos en consulta (05) y gestión del organizador (05b) — la spec original superaba los ocho escenarios — propuesta de la IA, aceptada; se actualizó el roadmap.
  - Recaudación de un evento como suma de las compras pagadas; rango de precios inválido como error 400; categoría inexistente como lista vacía en la búsqueda y como error 422 al crear un evento — opciones recomendadas por la IA, elegidas por mí.
- **Aprendizaje:** el subagente revisor detectó un problema de seguridad sutil (filtración por tiempo de respuesta) y desvíos respecto de la spec que los tests no podían mostrar, porque tests y código se escribieron a partir de la misma interpretación.

## Sesión 5 — 2026-11-10 — Consulta de eventos y especificación de eventos del organizador

- **Objetivo:** implementar la consulta de eventos según la spec 05, cerrarla con revisión y especificar la gestión de eventos del organizador (spec 05b).
- **Avances:**
  - Consulta de categorías y eventos desarrollada con TDD: búsqueda por texto, filtros por categoría, precio y eventos pasados, orden por fecha, precio y puntaje del organizador, paginado, favoritos según la sesión y detalle con disponibilidad (spec 05). El filtrado vive en el repositorio y el orden y el paginado, en el servicio; el puntaje de los organizadores se calcula una sola vez por pedido.
  - Revisión de cierre con la skill de calidad y el subagente de reglas de negocio: sin hallazgos graves; se aprobaron y aplicaron los siete hallazgos, uno de ellos en una rama de corrección aparte (validación estricta de ids, código de la Iteración 1).
  - Integración en `develop`: 422 tests en verde y chequeo de calidad sin errores ni duplicados.
  - Spec 05b (crear evento y "mis eventos") en borrador, con los planes de API y de dominio actualizados.
- **Decisiones:**
  - Los parámetros numéricos vacíos en la consulta se ignoran en lugar de interpretarse como 0, y el límite del texto de búsqueda se aplica después de recortarlo — hallazgos del subagente revisor, aplicados con mi aprobación; se documentaron en la spec 05.
  - Validación repartida entre capas al crear eventos: el esquema de entrada controla solo forma y tipos (400) y el dominio, los rangos y reglas de negocio (422), para que cada regla tenga un único lugar — propuesta de la IA, aceptada (spec 05b).
  - "Mis eventos" incluye los eventos pasados, ordenados por fecha, y agrega el cupo total al contrato para que la pantalla pueda mostrar vendidas sobre cupo; las vendidas cuentan el cupo ocupado y lo recaudado, solo las compras pagadas — opciones recomendadas por la IA, elegidas por mí; se actualizó `planes/03`.
  - Límites de entrada al crear eventos (hasta 5 imágenes con URL http o https, de 1 a 10 tipos de entrada, descripción de hasta 2000 caracteres) — propuesta de la IA, aceptada.
- **Aprendizaje:** escribir los tests antes del código no alcanza cuando la misma IA escribe los dos: el caso del parámetro vacío no estaba previsto en ninguno de los dos. La revisión independiente sigue siendo la que encuentra esos huecos.

## Sesión 6 — 2026-11-10 — Eventos del organizador y compras del comprador

- **Objetivo:** implementar la creación de eventos y el listado "mis eventos" según la spec 05b, cerrarla con revisión e integrarla, y especificar e implementar las compras del comprador.
- **Avances:**
  - Spec 05b aprobada e implementada con TDD: métodos de dominio para el cupo total y para saber si una compra suma a lo recaudado, búsqueda de compras por organizador, validación del alta de eventos y de la consulta paginada, alta de eventos con categoría verificada y listado del organizador con vendidas, cupo y recaudado calculados una sola vez por pedido. El paginado pasó a un módulo compartido.
  - Revisión de cierre con la skill de calidad (4 hallazgos) y el subagente de reglas de negocio (6 hallazgos, ninguno grave). Se aplicaron los siete que recomendó la IA y una regla de negocio: helpers de prueba compartidos, tests duplicados eliminados, nuevos casos de integración (orden de autorización y validación, puntaje del organizador, imágenes por defecto) y corrección de la spec.
  - Integración en `develop`: 485 tests en verde y chequeo de calidad sin errores.
  - Compras especificadas en dos specs por rol y aprobadas: 06 (comprar, mis compras, detalle, pago y cancelación) y 06b (marcar utilizada y compras de un evento). Se actualizaron `planes/03` y el roadmap.
  - Spec 06 implementada con TDD: servicio, controlador y rutas de compras, validación de la compra (de 1 a 10 entradas) y de la consulta por estado, y búsqueda de reseñas por comprador. Las reglas de estados ya estaban en el dominio y el servicio solo las orquesta.
  - Revisión de cierre: sin hallazgos graves. Se aplicaron doce de los trece que recomendó la IA:
    - mensajes de error compartidos en un único módulo, para que los servicios no dependan del middleware ni de otros servicios;
    - un único instante del reloj por pedido;
    - el evento se guarda cuando cambia el cupo;
    - casos de integración para pagar o cancelar una compra de un evento ya ocurrido y para los errores 400, 401, 403 y 404 de cada acción.
    Quedan 580 tests en verde.
- **Decisiones:**
  - Los nombres de tipos de entrada repetidos se detectan sin distinguir mayúsculas ni acentos ("Platea" y "Pláteá"), como los compararía una persona. La IA detectó el hueco y me consultó; le delegué la decisión. Se actualizaron `planes/02` y la spec 05b.
  - Partición de las compras por rol (comprador y organizador), porque una sola spec superaba los ocho escenarios — propuesta de la IA, aceptada.
  - Al reservar o liberar cupo se guarda también el evento, aunque el repositorio en memoria comparte las instancias, para que el cambio a una base de datos no pierda el cupo — hallazgo del subagente revisor, aplicado con mi aprobación (spec 06, C9).
  - "Mis compras" muestra primero los eventos próximos (el más cercano arriba) y después los pasados, en lugar del orden por fecha ascendente del plan; tope de 10 entradas por compra; las compras de un evento se muestran de la más nueva a la más vieja — opciones recomendadas por la IA, elegidas por mí; se actualizó `planes/03`.
- **Aprendizaje:** en la spec 06 la IA escribió mal un test de integración: daba por hecho que los ids de tipo de entrada son globales, cuando se numeran por evento. Hubo que corregir el test y la redacción de la spec. Además, la revisión de reglas encontró que la propia spec pedía algo distinto de la convención del repo, y que los tests no probaban el orden entre autorización y validación. Las dos cosas pasaban inadvertidas porque el código funcionaba.

## Sesión 7 — 2026-11-10 — Compras del organizador y especificación de reseñas y favoritos

- **Objetivo:** implementar la spec 06b (marcar una compra como utilizada y listar las compras de un evento), cerrarla con revisión e integrarla, y especificar reseñas y favoritos.
- **Avances:**
  - Spec 06b implementada con TDD:
    - marcar utilizada responde 404 antes que 403 y devuelve el detalle con las acciones del organizador;
    - el listado de compras de un evento trae la disponibilidad por tipo sin filtrar por estado, con las compras de la más nueva a la más vieja y paginadas;
    - se reutilizaron el armado de respuestas, el paginado y la validación de la consulta de la spec 06;
    - la acción con permiso se generalizó para que comprador y organizador compartan el flujo buscar → verificar → aplicar → guardar.
  - Revisión de cierre con la skill de calidad (4 hallazgos) y el subagente de reglas de negocio (4 hallazgos, todos de severidad baja). Se aplicaron los seis que recomendó la IA:
    - fakes de repositorios y usuarios de prueba compartidos;
    - pruebas de permisos tabuladas para los dos endpoints;
    - orden más claro de los parámetros del servicio;
    - errores completos de `POST /compras/:id/uso` en `planes/03`;
    - un test que asegura que marcar utilizada no altera el cupo.
    Los clones detectados por jscpd volvieron casi al nivel previo. Integración en `develop` con 611 tests en verde.
  - Spec 07 (reseñas y favoritos) escrita, propagada a `planes/03`, aprobada e implementada con TDD:
    - alta de reseñas con el orden de chequeos fijado (404, 403, 409, 422);
    - listado público de reseñas por organizador, con promedio y cantidad calculados sobre el total;
    - favoritos del comprador, que reutilizan el armado de resúmenes de eventos con el puntaje calculado una vez por pedido.
  - Revisión de cierre de la 07 (calidad: 4 hallazgos; reglas: 4, todos de severidad baja). Se aplicaron los siete recomendados:
    - búsqueda de compra y chequeo de permiso compartidos entre servicios;
    - orden de eventos por fecha llevado al dominio;
    - validación de paginación unificada;
    - eliminación de una regla no pedida (descartar favoritos de eventos inexistentes);
    - un test que fija el 409 antes que el 422.
    Quedan 683 tests en verde.
  - Spec 07b (Swagger) escrita, aprobada e implementada:
    - documento OpenAPI 3.0.3 modular, escrito a mano a partir de `planes/03`, servido en `/api-docs` y `/api-docs.json`;
    - la autenticación se marca por operación según el rol;
    - los tests verifican que el documento cubra exactamente los endpoints implementados, que las referencias resuelvan y que la autenticación y los parámetros sean consistentes.
  - Revisión de cierre de Swagger (calidad: 3 hallazgos; reglas: 12, ninguno grave). Se aplicaron los doce:
    - errores 422 que el documento omitía (alta de eventos, cancelación, uso);
    - enumeraciones y límites tomados del dominio y de las validaciones en lugar de copiados;
    - ejemplos alineados con los ids reales del seed, corregidos también en `planes/03`;
    - helpers para los schemas que se extienden.
    Quedan 698 tests en verde. Con esto se completan los ítems de la Iteración 2.
- **Decisiones:**
  - Se descartaron dos hallazgos de la revisión: blindar el orden del listado contra cambios del seed, que ya lo cubre el test unitario, y evitar guardar el evento al marcar utilizada, porque guardar siempre compra y evento es más simple y consistente — recomendación de la IA, aceptada.
  - Spec 07 — opciones recomendadas por la IA y elegidas por mí:
    - el alta de una reseña devuelve la reseña con la misma forma que el listado;
    - las reseñas del organizador van de la más nueva a la más vieja, con 404 si el id no corresponde a un organizador;
    - los favoritos se listan por fecha del evento, incluidos los pasados;
    - agregar y quitar favoritos son operaciones idempotentes y permisivas.
  - Spec 07: la IA fijó por su cuenta que el conflicto (409) se informa antes que la compra no utilizada (422), y el texto del mensaje de conflicto. Quedó señalado en la spec como revisable.
  - Swagger se escribe a mano y no se genera desde zod, para seguir el formato del TP grupal y no sumar dependencias. Como contrapartida, ningún test contrasta las descripciones con el comportamiento real; esa verificación queda a cargo de la revisión — propuesta de la IA, aceptada.
- **Aprendizaje:** la métrica de duplicación pasaba holgada (1,3 % contra un umbral de 3 %), pero los clones en tests se habían quintuplicado. Revisar la tendencia respecto de `develop`, y no solo el umbral, mostró que los fakes y helpers de prueba tenían que compartirse. En Swagger, la revisión contra el código encontró tres errores de negocio no documentados y ejemplos con ids que no existían en el seed, copiados de `planes/03`: un documento escrito a mano puede ser consistente consigo mismo y aun así no coincidir con la implementación.

## Sesión 8 — 2026-11-10 — Chat de la compra (It3), cierre de la iteración y base del front (It4)

- **Objetivo:** especificar e implementar el chat de la compra (CU5 y CU6) en sus dos ramas, REST y tiempo real, cerrar la It3 y arrancar la It4 con la base del front.
- **Avances:**
  - Specs 08 (chat por REST) y 08b (Socket.io), separadas porque juntas superaban los ocho escenarios. Se propagaron a `planes/03` los errores, el orden de los mensajes, los errores del ack y la regla del estado final.
  - Spec 08 implementada con TDD: `GET` y `POST /compras/:id/mensajes`, solo para los participantes y en cualquier estado de la compra (R7), con Swagger.
  - Spec 08b implementada con TDD:
    - autenticación JWT en el handshake y rooms por compra;
    - `mensaje:nuevo` después de cada mensaje persistido;
    - `compra:estado` después de pagar, cancelar o marcar utilizada.
    - Se aplicó el patrón "REST para escribir, socket para notificar" (ADR-005) mediante un notificador inyectable, de modo que los tests de servicio no necesitan sockets.
    - La aceptación de la iteración se verificó con dos clientes `socket.io-client` contra el servidor en un puerto efímero.
  - Cierre de cada rama con la skill de calidad y el subagente de reglas de negocio:
    - En la primera rama se aplicaron 6 hallazgos de 10; en la segunda, 7 de 9.
    - Entre los aplicados están el resguardo para que una falla al emitir no altere la respuesta REST, el caso de token vencido y la normalización del id al salir de un room.
  - Iteración 3 cerrada (`main` + tag `it3`), con 799 tests en verde.
  - Spec 09 (base del front con login) implementada con TDD: tema MD3 claro y oscuro con colores de estado verificados por contraste AA, cliente HTTP con token y cierre de sesión ante un 401, sesión persistida (secure-store en el celular, `localStorage` en web) y validada con `GET /auth/yo` al abrir la app, navegación por rol con `Stack.Protected`, Login y Perfil, y componentes transversales. 81 tests de front, incluida la navegación con `expo-router/testing-library`. La revisión con el subagente `qa-mobile` dejó 9 hallazgos aplicados, entre ellos el área segura del celular, el teclado y el tema de navegación en modo oscuro.
- **Decisiones:**
  - Un único `compra:estado` con el estado final: cancelar una compra confirmada emite REEMBOLSADA y no CANCELADA — evita estados intermedios en el cliente — propuesta de la IA, aceptada.
  - `mensaje:nuevo` se emite a todo el room, incluido el autor, y el cliente deduplica por id — el endpoint REST no conoce el socket del emisor — propuesta de la IA, aceptada.
  - El chat no se pagina — los chats de una compra son cortos y así lo fija el contrato — propuesta de la IA, aceptada.
  - Login incluido en la rama base del front, restauración de la sesión validada contra el back, solo componentes transversales y tabs provisorios — sin login no se podía probar la sesión de punta a punta — propuestas de la IA, aceptadas.
  - Antes de escribir código del front, la IA leyó la documentación de Expo SDK 58 (rutas protegidas, tabs, secure-store, testing), como pide `frontend/AGENTS.md`, en lugar de confiar en lo que recordaba de versiones anteriores.
  - Servicio de mensajes separado del de compras y extracción de `parsearId` para compartirlo entre los controladores y el socket — decisión de la IA, señalada como revisable en la spec.
- **Aprendizaje:** la suite completa pasaba, pero el servidor real se caía con la primera conexión de un cliente por defecto. El diseño que la IA había escrito en la spec registraba Express después de Socket.io. Por eso Express respondía 404 a las peticiones de long-polling, y los tests no lo detectaban porque solo usaban websocket. Lo encontró una prueba manual del `server.js` antes de cerrar la rama. Se corrigió con un test de regresión que fuerza ese transporte. Que los tests pasen no prueba que el sistema funcione si los tests no ejercitan la configuración real; levantar el proceso real antes de cerrar una rama sigue siendo necesario. Por eso, la base del front se verificó además con un bundle web de producción contra el back real. Esa prueba confirmó que los usuarios demo no aparecen fuera de desarrollo y encontró que el soporte de Cypress del repo no funciona con Cypress 16, una tarea que quedó anotada para It5.

## Sesión 9 — 2026-11-11 — Explorar eventos y detalle del evento (It4)

- **Objetivo:** especificar e implementar la búsqueda de eventos y su detalle (CU3, CU10 y CU11), primera pantalla del comprador.
- **Avances:**
  - Spec 10 escrita y aprobada. El alcance del comprador se dividió en cuatro specs: 10 (explorar y detalle), 10b (comprar), 10c (mis compras, pago y cancelación) y 10d (reseñar y favoritos).
  - Spec 10 implementada con TDD: búsqueda con debounce, chips de categoría, menú de orden, paginado con "Cargar más", pull-to-refresh, descarte de respuestas de criterios viejos, detalle con tipos de entrada, reputación del organizador y favorito.
  - Verificación con una spec temporal de Cypress contra el back real sobre Expo Web, eliminada al cerrar la rama; los flujos e2e definitivos quedan para It5.
  - Revisión de calidad con 9 hallazgos aprobados y aplicados con TDD, entre ellos: un solo pedido al limpiar filtros, protección contra pedidos duplicados de la página siguiente, conservación de la lista cuando falla el refresco, etiqueta accesible completa de la tarjeta y placeholder ante imágenes que no cargan. Suite del front en 137 tests en verde; rama mergeada a `develop`.
- **Decisiones:**
  - Partir la spec del comprador en 10, 10b, 10c y 10d — cada una queda acotada a una rama revisable — propuesta de la IA, aceptada.
  - Menú de orden con 6 opciones (fecha, precio y puntaje del organizador, en ambos sentidos) — cubre CU11 sin pantallas adicionales — elección del autor entre alternativas de la IA.
  - Mostrar solo las últimas 3 reseñas del organizador, sin pantalla "ver todas" — suficiente para decidir una compra — elección del autor.
  - Favorito optimista con rollback y aviso del error del back — respuesta inmediata sin perder consistencia — elección del autor.
  - Botón Comprar deshabilitado con el texto "Agotado" cuando ningún tipo tiene disponibles — elección del autor.
  - Si falla el pull-to-refresh, la lista ya cargada se conserva y el error se muestra al pie, igual que al fallar "Cargar más" — hallazgo de la revisión, incorporado a la spec.
- **Aprendizaje:** dos intervenciones de la IA requirieron corrección del autor. Primero, ejecutó Prettier sobre `planes/`, lo que reformateó documentos fuera del alcance de la tarea y hubo que revertir. Segundo, escribió un test de `useCargar` que creaba la función de carga en cada render; como el hook depende de esa referencia, las recargas no terminaban y la suite quedaba colgada. Ambos casos muestran que el trabajo generado necesita revisión aunque la tarea parezca mecánica.

## Sesión 10 — 2026-11-11 — Compra de entradas (It4)

- **Objetivo:** especificar e implementar la pantalla de compra (CU12), segunda feature del comprador.
- **Avances:**
  - Spec 10b escrita y aprobada, sin reglas de negocio nuevas: la pantalla aplica R1 y el tope de 10 entradas por compra de la spec 06, y el back sigue siendo quien decide.
  - Spec 10b implementada con TDD: elección del tipo de entrada con los agotados deshabilitados, `SelectorCantidad` con tope `min(disponibles, 10)`, total calculado, protección contra el doble envío, manejo del 422 y ruta de compra restringida al rol COMPRADOR, lo que cerró el pendiente de la spec 10.
  - Para no repetir los estados de carga del detalle se extrajeron componentes compartidos (`ConCarga`, `ConEvento`); el detalle del evento pasó a usarlos sin cambios de comportamiento.
  - Revisión de calidad con 3 hallazgos aprobados y aplicados: un único texto de disponibilidad para el detalle y la compra, una función común para obtener el código HTTP de un error y tests propios de la lógica de selección.
  - Verificación con una spec temporal de Cypress contra el back real (compra exitosa, falta de cupo provocada desde otra sesión y acceso de un organizador por URL), eliminada al cerrar la rama. Suite del front en 165 tests en verde; rama mergeada a `develop`.
- **Decisiones:**
  - Después de comprar, reemplazar la pantalla por la compra creada (`compras/[id]`, provisoria hasta la spec 10c) — la navegación no cambia cuando llegue el detalle real — propuesta de la IA, aceptada.
  - Preseleccionar el primer tipo con disponibles — el total se ve desde el inicio — propuesta de la IA, aceptada.
  - Ante un 422, mostrar el mensaje del back, recargar el evento y ajustar la cantidad conservando el tipo elegido — el usuario ve el cupo real sin perder lo que había elegido — propuesta de la IA, aceptada.
  - Sin diálogo de confirmación — la compra nace pendiente y se puede cancelar — propuesta de la IA, aceptada.
- **Aprendizaje:** la verificación de punta a punta volvió a ser necesaria, aunque esta vez los fallos fueron del propio test temporal y no de la aplicación: un selector por texto encontraba un elemento oculto de la pantalla anterior, que el stack de navegación mantiene montado. Con selectores por `testID` el problema desaparece.

## Sesión 11 — 2026-11-11 — Mis compras y detalle de la compra (It4)

- **Objetivo:** especificar e implementar la consulta de compras del comprador (CU1).
- **Avances:**
  - La feature de compras del roadmap se dividió en dos specs: 10c (lista y detalle de solo lectura) y 10c2 (pagar y cancelar, CU7 y CU8), porque juntas superaban los ocho escenarios. Se actualizaron el roadmap y el plan de pantallas.
  - Spec 10c implementada con TDD: lista paginada con filtro por estado, tarjeta con estado y días restantes, refresco al volver al tab, detalle con la línea de tiempo del historial y manejo de 403 y 404.
  - Antes de agregar la segunda lista paginada, la de Explorar se generalizó en piezas compartidas (hook, lista, pie y chips de filtro). Las métricas de duplicación marcaron tres clones nuevos durante la implementación; se resolvieron extrayendo componentes (`FechaYLugar`, `ConRecursoDeRuta`, `useEstadoCompra`), sin tocar umbrales.
  - Revisión de calidad con 1 hallazgo aprobado y aplicado: una función común para adaptar las respuestas paginadas, que van a reutilizar Favoritos y las pantallas del organizador.
  - Verificación con una spec temporal de Cypress contra el back real (filtro por estado con historial completo y compra nueva visible al volver al tab), eliminada al cerrar la rama. Suite del front en 192 tests en verde; rama mergeada a `develop`.
- **Decisiones:**
  - Partir CU1 de CU7 y CU8 en dos specs — ramas más chicas y revisables — propuesta de la IA, aceptada.
  - Filtro con chips "Todas" + los 5 estados — coincide uno a uno con el parámetro `estado` del contrato — propuesta de la IA, aceptada.
  - Los botones de otras features (reseñar, chat, marcar utilizada) aparecen recién con su spec, sin rutas vacías — propuesta de la IA, aceptada.
  - Pagar sin diálogo y con confirmación por Snackbar, para la spec 10c2 — pagar no es destructivo — propuesta de la IA, aceptada.
- **Aprendizaje:** la primera corrida de Cypress falló por un servidor web que había quedado vivo de la sesión anterior y servía código desactualizado. Detener la tarea en segundo plano no terminaba el proceso hijo. Una falla de verificación puede venir del entorno y no del código, y conviene leer la captura antes de tocar la implementación.

## Sesión 12 — 2026-11-11 — Pagar y cancelar compras (It4)

- **Objetivo:** especificar e implementar el pago y la cancelación de una compra desde su detalle (CU7 y CU8).
- **Avances:**
  - Spec 10c2 escrita y aprobada; los huecos (comportamiento ante un 422, ubicación del error, texto del diálogo y aviso al cancelar) se resolvieron en una sola tanda de preguntas. El plan de pantallas sumó dos identificadores de prueba.
  - Implementación con TDD: botones habilitados por las `acciones` que calcula el back, pago directo con Snackbar, cancelación con diálogo de confirmación que informa el reembolso, protección contra el doble toque y actualización del detalle con la respuesta del back sin volver a pedirlo.
  - Revisión de calidad con 3 hallazgos aplicados: el envío protegido que repetían la compra y las acciones de la compra pasó a un hook común (`useEnvio`), que van a reutilizar Reseñar y Marcar utilizada; se eliminó código muerto heredado de la sesión anterior y se unificó el patrón de los manejadores asíncronos.
  - Verificación con una spec temporal de Cypress contra el back real (pagar una compra pendiente; cancelar una confirmada, que termina reembolsada), eliminada al cerrar la rama. Suite del front en 212 tests en verde; rama mergeada a `develop`.
- **Decisiones:**
  - Los botones salen de `compra.acciones` y el front no reimplementa las reglas R2, R2b y R3 — una sola fuente de verdad — decisión del usuario.
  - Ante un 422, mostrar el texto del back y recargar la compra — los botones reflejan el estado real — propuesta de la IA, aceptada.
  - El texto del diálogo menciona el reembolso si la compra está confirmada — es la única derivación de R2b en el front, porque el contrato no expone ese dato; se aceptó en la revisión en lugar de ampliar el contrato — propuesta de la IA, aceptada.
  - Extraer `useEnvio` recién con la segunda aparición del patrón, ya que la tercera y la cuarta están planificadas (10d y 11) — propuesta de la IA en la revisión, aceptada.

## Sesión 13 — 2026-11-11 — Reseñar compras, favoritos, pantallas del organizador y creación de eventos (It4)

- **Objetivo:** especificar e implementar la reseña de una compra utilizada (CU9), la pestaña Favoritos del comprador y las pantallas del organizador para seguir ventas y marcar entradas utilizadas (CU2).
- **Avances:**
  - Spec 10d escrita y aprobada sin partir (8 escenarios); los huecos (carga previa de la compra, comportamiento tras el envío, validación local y alcance de Favoritos) se resolvieron en una sola tanda de preguntas. El plan de pantallas se actualizó con los nuevos identificadores de prueba.
  - Implementación con TDD: pantalla Reseñar con estrellas editables, comentario con contador y envío protegido reutilizando `useEnvio`; DetalleCompra suma el botón Reseñar habilitado por `acciones.puedeReseniar`, la sección con la reseña hecha, la recarga al recuperar el foco y el aviso de confirmación; la pestaña Favoritos reutiliza `TarjetaEvento` y la lista paginada existente.
  - Revisión de calidad con 7 hallazgos aplicados (1 de severidad media, 6 bajas): se extrajeron componentes compartidos para el aviso con "Volver", la carga de la compra de la ruta y el encabezado del evento, se unificó el recorrido de las estrellas y se eliminó código muerto heredado.
  - Verificación con una spec temporal de Cypress contra el back real (reseñar una compra utilizada; marcar un favorito y verlo en la pestaña), eliminada al cerrar la rama. Suite del front en 246 tests en verde y métricas de calidad sin clones en el front; rama mergeada a `develop`.
- **Decisiones:**
  - El botón Reseñar y la disponibilidad del formulario salen de `acciones.puedeReseniar`; el front no reimplementa R5 — una sola fuente de verdad — decisión del usuario.
  - Ante un 409 o un 422 al reseñar se muestra el texto del back sin recargar la compra, a diferencia de pagar y cancelar — la recarga reemplazaría el formulario y el mensaje por el estado "no se puede reseñar" — propuesta de la IA, aceptada.
  - Volver al detalle con `router.dismissTo` y un parámetro de aviso, en lugar de un estado global — resuelve también la entrada por enlace directo — propuesta de la IA, aceptada y verificada en web con Cypress.
  - Extraer `useRecargarAlVolver` al aparecer su segundo y tercer uso (DetalleCompra y Favoritos) — propuesta de la IA, aceptada.
- **Avances (pantallas del organizador):**
  - Spec 11 partida a propuesta de la IA: la 11 cubre Mis eventos, Compras del evento y Marcar utilizada (CU2), y la creación de eventos (CU4) queda para la 11b. El plan de pantallas y el roadmap se actualizaron con la partición.
  - Implementación con TDD: Mis eventos con vendidas sobre cupo, recaudado y marca de evento finalizado; Compras del evento con la disponibilidad por tipo, filtro por estado y el comprador de cada compra; Marcar utilizada en el detalle de la compra con diálogo de confirmación; la reseña se titula según el rol de quien la ve.
  - Revisión de calidad con 3 hallazgos aplicados: cada acción de la compra pasó a definirse una sola vez en un catálogo que usan botones, diálogo y hook (agregar el chat en la spec 12 va a ser sumar una entrada); se corrigió un parpadeo del diálogo al cerrarse; se partió el archivo de tests del detalle.
  - Verificación con una spec temporal de Cypress contra el back real (Fénix marca utilizada una compra confirmada desde Mis eventos), eliminada al cerrar. Suite del front en 273 tests en verde; rama mergeada a `develop`.
- **Decisiones (pantallas del organizador):**
  - Partir la spec del organizador en dos ramas — superaba holgadamente los 8 escenarios y la creación de eventos tiene huecos propios (selector de fecha, tipos dinámicos) — propuesta de la IA, aceptada.
  - Marcar utilizada con diálogo de confirmación, como cancelar — es irreversible y habilita la reseña — propuesta de la IA, aceptada.
  - La marca de evento finalizado se calcula en el front comparando la fecha con el reloj — es solo presentación, no una regla de negocio — propuesta de la IA, aceptada.
  - La lista paginada expone los datos de la primera página que no son ítems (evento y disponibilidad), en lugar de un segundo pedido — un solo endpoint ya los devuelve — propuesta de la IA, aceptada.
- **Avances (creación de eventos):**
  - Spec 11b escrita y aprobada (6 escenarios): formulario de evento con categoría, fecha, hora, imagen opcional y de 1 a 10 tipos de entrada con precio y cupo (CU4); al publicar se vuelve a Mis eventos con un aviso de confirmación.
  - Implementación con TDD: el armado del cuerpo del pedido y la completitud del formulario quedaron como funciones puras, el estado del formulario en un hook propio y los tipos de entrada en un componente aparte; el aviso por parámetro de ruta, que antes vivía en DetalleCompra, pasó a un hook compartido que también usa Mis eventos.
  - Revisión de calidad con 5 hallazgos aplicados: un componente común para las listas de compras del comprador y del organizador, la disponibilidad por tipo dentro del encabezado de la lista, un espacio inferior para que el botón flotante no tape el último evento, la agrupación de los campos del formulario y un indicador de carga de las categorías. El componente común resolvió además dos clones entre pantallas de la spec 11 que la herramienta de duplicados recién detectó tras normalizar los fines de línea.
  - Verificación con una spec temporal de Cypress contra el back real (Fénix publica un evento y lo ve en Mis eventos), eliminada al cerrar. Suite del front en 312 tests en verde, sin clones en el front; rama mergeada a `develop`.
- **Decisiones (creación de eventos):**
  - Selector de fecha y hora con `react-native-paper-dates` — funciona en Expo Go y en web (necesario para Cypress) y respeta el estilo de Paper; el selector nativo no corre en web — propuesta de la IA entre tres opciones, aceptada (ADR-009).
  - El front valida solo que el formulario esté completo; las reglas de R8 (fecha futura, nombres de tipo únicos, precio y cupo válidos) las responde el back con su mensaje — una sola fuente de verdad — propuesta de la IA, aceptada.
  - Mock manual de la librería de fechas para Jest — publica módulos que Jest no transforma y sus modales no se pueden operar desde los tests — surgió de la IA al correr la suite.
  - El caso de agregar hasta 10 tipos se prueba en el hook y no en la pantalla — con diez grupos de campos el test superaba el tiempo límite al correr en paralelo — propuesta de la IA, aceptada.
- **Aprendizaje:** en Expo Web las pestañas inactivas permanecen montadas, por lo que las aserciones e2e deben acotarse al contenedor de la pantalla visible para no dar falsos negativos.

## Sesión 14 — 2026-11-13 — Chat de la compra en la app (It4)

- **Objetivo:** cerrar la creación de eventos (registrada en la sesión 13) y especificar e implementar el chat de la compra en la app (CU5 y CU6), último ítem de la Iteración 4.
- **Avances:**
  - Spec 12 escrita y aprobada sin partir (8 escenarios). Los huecos (aparición del mensaje propio, contenido de cada burbuja, comportamiento sin conexión y límite del texto) se resolvieron en una sola tanda de preguntas. El plan de pantallas se actualizó con los identificadores de prueba.
  - Implementación con TDD: pantalla Chat para los dos roles, con burbujas propias y ajenas, contador, envío por REST y recepción en vivo por Socket.io con deduplicación por id; un hook compartido administra la conexión, el room de la compra y la recarga tras perder la conexión. DetalleCompra suma el botón Chat y se actualiza cuando la otra parte cambia el estado de la compra.
  - Revisión de calidad con 6 hallazgos aplicados (1 de severidad media, 5 bajas): una recarga fallida ya no reemplaza la conversación por el error, el contador de caracteres pasó a un componente compartido con Reseñar, se simplificó el registro de eventos del socket y su mock, y se compartieron los datos de prueba del chat.
  - Verificación con una spec temporal de Cypress contra el back real (Ana escribe en una compra y Fénix ve el mensaje en su chat, en dos sesiones), eliminada al cerrar. Suite del front en 364 tests en verde y sin clones en el front; rama mergeada a `develop`.
- **Decisiones:**
  - El mensaje propio aparece al confirmarse el envío (201) y no de forma optimista; el que llega también por el socket se descarta por id — menos estado y una sola fuente de verdad — propuesta de la IA, aceptada.
  - Aviso "Sin conexión en vivo" con actualización manual y recarga automática al reconectar; escribir sigue funcionando por REST — aplica el patrón de ADR-005 — propuesta de la IA, aceptada.
  - El botón Chat se declara en el catálogo de acciones de la compra: las entradas pueden navegar a una ruta y el permiso pasa a ser opcional, porque R7 permite el chat en cualquier estado; Reseñar se migró al mismo esquema — una sola forma de declarar botones — propuesta de la IA, aceptada.
  - Un socket por pantalla en lugar de uno compartido — el chat y el detalle pueden estar abiertos a la vez en la pila de navegación, y salir del room desde uno sacaría también al otro — propuesta de la IA, aceptada.
- **Aprendizaje:** un test que verifica el mecanismo interno (cantidad de oyentes registrados) en lugar del comportamiento observable pasó sin cambios ante un refactor que lo debía afectar; se reescribió para comprobar que, tras salir de la pantalla, un evento ya no llega a su destinatario.

## Sesión 15 — 2026-11-14 — Flujos e2e, imagen Docker, pulido de UI y revisión final (It5)

- **Objetivo:** iniciar la Iteración 5 (Calidad) con tres flujos e2e permanentes contra el back real, adecuar la infraestructura de Cypress a la versión 16 empaquetar el back en una imagen Docker hacer la revisión visual de la app y la revisión final de reglas y código.
- **Avances:**
  - Spec 13 escrita y aprobada. Los huecos (alcance del flujo de compra, forma de verificar el chat, cambio de usuario dentro de un flujo y responsabilidad del comando de e2e) se resolvieron en una sola tanda de preguntas. El plan de testing se actualizó: cambiaron los flujos y el inicio de sesión pasó a hacerse por la interfaz.
  - Tres flujos, uno por archivo, con reinicio de datos antes de cada uno: Ana busca un evento, compra y ve la compra pendiente; Fénix marca utilizada una compra de Ana y Ana la reseña; Ana escribe en el chat, recibe en vivo la respuesta de Fénix enviada por la API y Fénix ve el mensaje al ingresar.
  - Comandos compartidos de Cypress para ingresar, cerrar sesión, volver a una pestaña y abrir una compra como comprador u organizador. Un comando nuevo levanta el back en modo test y la app web con sus variables de entorno, de forma multiplataforma.
  - Revisión de calidad con 5 hallazgos aplicados (2 de severidad media y 3 bajas): la navegación repetida entre flujos pasó a comandos, la vuelta a las pestañas dejó de depender de la profundidad del historial y se verificó manualmente que, con el back fuera de modo test, los flujos fallan en el reinicio sin tocar datos.
  - Verificación: 3/3 flujos, 799 tests del back y 364 del front en verde, sin clones nuevos; rama mergeada a `develop`.
  - Spec 14 e imagen Docker del back: una sola etapa sobre Node 24 Alpine, solo dependencias de producción y el código fuente, usuario sin privilegios, modo producción por defecto y chequeo de salud contra el endpoint existente. Se verificó que responde y queda saludable, que en producción no expone el reinicio de datos, que sin secreto no arranca, que la imagen no incluye tests ni secretos y que los tres flujos e2e pasan contra el contenedor en modo test. La revisión de calidad dejó una aclaración en el README sobre el archivo de entorno de ejemplo.
  - Revisión visual con la skill del sistema de diseño: capturas de las 14 pantallas en modo claro y oscuro sobre la versión web, forzando el esquema de color desde una spec temporal de Cypress, más un análisis estático de colores, tipografía y etiquetas de accesibilidad. El modo oscuro no tenía colores rotos. Spec 15 con tres hallazgos aprobados y corregidos con TDD: en la web la barra de ventas del organizador superponía su texto con lo recaudado; los chips de filtro no distinguían bien el activo, sobre todo en modo oscuro; y la tarjeta de los eventos propios no tenía etiqueta para lectores de pantalla. La revisión de calidad puso al día el catálogo de componentes de la skill, al que le faltaban siete componentes compartidos.
  - Revisión final con dos revisores independientes: el subagente de reglas de negocio no encontró reglas violadas ni contratos rotos y confirmó la cobertura de los doce casos de uso, salvo la compra de un evento ya ocurrido; la revisión de código encontró diez problemas del front, verificados uno por uno. Spec 16 con ocho arreglos: el contrato de eventos informa si el evento ya ocurrió y la app deja de ofrecer comprarlo; la navegación espera a restaurar la sesión, lo que resolvió que una recarga o un enlace directo en web llevara a las pestañas; una recarga fallida conserva los datos en pantalla; el detalle del evento se actualiza al volver; un error posterior a una compra exitosa ya no se informa como error de conexión; y se unificó un componente de error en línea repetido.
- **Decisiones:**
  - Migración de `Cypress.env()` a `Cypress.expose()`, con la clave en la raíz de la configuración y no dentro de `e2e` — la versión 16 eliminó `Cypress.env()` — la IA verificó la API en la documentación oficial y en los tipos de la versión instalada en lugar de usar conocimiento previo.
  - El flujo de chat combina la interfaz con una respuesta enviada por la API — Cypress controla un solo navegador, y así se prueba la recepción en vivo por el socket — propuesta de la IA, aceptada.
  - Los servidores se levantan con un comando aparte y `npm run e2e` solo ejecuta Cypress — evita procesos colgados en Windows — propuesta de la IA, aceptada.
  - Imagen sobre Node 24 y no Node 20 como la referencia de la cátedra, sin compose — Node 20 está fuera de soporte y los tests corren con la versión 24; con persistencia en memoria no hay servicios que orquestar — la IA comparó las referencias y propuso las opciones; el usuario eligió (ADR-010).
  - Los chips de filtro siguen el patrón de Material 3 (no elegidos delineados, elegido con relleno) — el relleno casi igual hacía depender la selección de la marca de verificación — propuesta de la IA, aceptada.
  - Se agrega `finalizado` al contrato de eventos — el front no podía saber si un evento ya ocurrió sin repetir una regla del dominio — propuesta de la IA a partir del revisor, aceptada por el usuario al delegar la selección.
  - Se descartan dos hallazgos de la revisión de código (cambiar el tipo de entrada agotado tras un error de cupo y recargar la reseña ante un conflicto) — contradecían decisiones explícitas de specs anteriores y sus tests — la IA los detectó al ir a cambiar esos tests, aunque el usuario había delegado la selección.
- **Aprendizaje:** en la versión web, una pantalla cubierta por otra sigue en el documento; los selectores e2e deben acotarse a un contenedor o a elementos visibles, igual que con las pestañas inactivas. En la revisión visual, dos de las tres anomalías iniciales eran capturas tomadas antes de que la pantalla terminara de cargar; medir el DOM separó esos falsos positivos del defecto real, cuya causa estaba en el componente de barra de progreso de la biblioteca de UI, que en web ocupa todo el alto de su contenedor. Un comportamiento anotado durante semanas como limitación de la versión web (los enlaces directos caían a las pestañas) resultó ser un defecto propio, detectado por la revisión de código y no por los tests, que navegaban siempre por la interfaz.

## Sesión 16 — 2026-11-17 — Ajustes para el celular y organización del contexto de IA

- **Objetivo:** integrar los ajustes surgidos de la primera prueba en un iPhone (spec 17) y reorganizar los archivos de instrucciones y las skills para que cada sesión cargue solo el contexto de la parte del repo en la que trabaja.
- **Avances:**
  - Spec 17 integrada a `develop`: el contenido ya no queda debajo del encabezado translúcido de iOS 26, las imágenes de los eventos las sirve el back (el servicio externo estaba caído), el teclado de la búsqueda se cierra al deslizar o confirmar, se agregó un logo y Explorar funciona como pantalla de inicio. Queda pendiente la verificación en el dispositivo.
  - Skills por carpeta: las de back (`crear-endpoint`, `modelar-dominio`) y front (`crear-pantalla`, `sistema-diseno`) pasaron a `backend/` y `frontend/`; `escribir-tests` se dividió en tres (back, front y e2e), y la del front incorporó lo aprendido sobre RNTL 14, mocks y helpers. Las transversales quedaron en la raíz. Se comprobó que Claude Code las carga recién al trabajar sobre archivos de esa carpeta.
  - Reglas por carpeta: el `AGENTS.md` raíz se redujo a lo común y cada parte (`backend/`, `frontend/`, `e2e/`) tiene el suyo, importado por un `CLAUDE.md` de una línea.
  - CodeGraph incorporado como servidor MCP del proyecto, con el índice local fuera de git. Una prueba desde otra sesión ubicó la regla de cancelación en el dominio, quién la invoca y su test en una sola consulta, sin leer archivos.
  - Se apagaron en el proyecto los plugins sin uso (Postman y Canva).
- **Decisiones:**
  - `AGENTS.md` por carpeta en lugar de un `RULES.md` — es el nombre que leen varios agentes y Claude Code lo incorpora mediante `CLAUDE.md`; `RULES.md` no lo lee ninguna herramienta por convención — propuesta de la IA, aceptada (ADR-011).
  - Mover skills por carpeta y apagar plugins — el diagnóstico de la IA mostró que de cada skill solo se carga la descripción hasta usarla, por lo que el ahorro principal estaba en los plugins sin uso; el usuario eligió apagar Postman y Canva y mantener gstack por su uso selectivo (ADR-011).
  - Se descarta el hook de CodeGraph que agrega contexto a cada mensaje — inyectaba código en todos los pedidos, en contra del objetivo, y en la prueba trajo código del front en lugar de la regla de dominio — decisión de la IA tras probar su salida (ADR-011).
- **Aprendizaje:** el índice de código responde mejor cuando se nombran los símbolos (`Compra.cancelar`) que con preguntas en lenguaje natural, donde palabras genéricas del dominio arrastran resultados de otras capas.

## Sesión 17 — 2026-11-19 — Rediseño visual, bandeja de mensajes y fotos de eventos (It5b)

- **Objetivo:** responder a tres pedidos del usuario: una pestaña de mensajes con notificaciones para el organizador, la carga de la portada de un evento sin pegar una URL y un rediseño que le diera a la app una identidad propia.
- **Avances:**
  - Relevamiento previo: no había bandeja ni registro de lectura (el chat solo se abría desde cada compra), las imágenes eran archivos servidos por el back y no un servicio externo, y dos listados (favoritos e historial del chat) no paginaban.
  - Maquetas de 8 pantallas en un lienzo de diseño, a partir de dos proyectos de referencia y de las pantallas existentes; el usuario las aprobó antes de escribir código.
  - Cinco specs (18 a 22) aprobadas en conjunto, con los planes de dominio, contratos y pantallas actualizados, y dos ADR. Se implementaron en cinco ramas mergeadas a `develop`:
    - Paginación de favoritos (`page`/`limit`) y del chat por cursor (`antesDe`), con "Ver mensajes anteriores" en la app.
    - Identidad visual: paleta de neutros cálidos con un único acento, tipografía Manrope, tarjetas planas con borde, estados en píldora y la tarjeta de compra con forma de entrada.
    - Bandeja de mensajes para ambos roles: reglas R11 (no leídos por participante) y R12 (conversaciones), dos endpoints, una sala de socket por usuario y un contador en la pestaña que se actualiza en vivo; nuevo flujo e2e.
    - Subida de la portada desde la galería al back, con validación de formato y tamaño.
    - Rediseño de pantallas: encabezados propios en las pestañas, barra inferior con precio y acción en el detalle y en la compra, entrada completa en el detalle de la compra, separadores por día en el chat y un resumen de ventas del organizador calculado en el back.
  - Verificación: 866 tests del back, 456 del front y 4/4 flujos e2e en verde; capturas de cada pantalla en claro y oscuro; clones de código de 7 a 6.
- **Decisiones:**
  - Marca de lectura en el servidor y no en el dispositivo — el contador tiene que coincidir en web y en el celular — propuesta de la IA, elegida por el usuario.
  - Imágenes subidas al back en lugar de un servicio en la nube — es coherente con la persistencia en memoria y no suma cuentas ni secretos — propuesta de la IA, elegida por el usuario (ADR-013).
  - Dirección visual "Minimal cálido" entre tres alternativas, validada con maquetas — el usuario eligió la dirección; la IA oscureció el acento para cumplir el contraste mínimo con texto blanco (ADR-012).
  - Paginar también el historial del chat, por cursor — los mensajes nuevos corren las páginas numeradas — propuesta de la IA, aceptada.
  - El resumen de Mis eventos se calcula en el back — sumar solo la página visible daba un total incorrecto — detectado por la IA al escribir la spec.
  - El usuario autorizó encadenar las cinco ramas (commit y merge al cerrar cada una) y aplicar los hallazgos de calidad sin aprobación previa; la revisión unificó tarjetas y barras repetidas en componentes compartidos.
- **Aprendizaje:** aprobar las cinco specs juntas, con las maquetas ya validadas, permitió encadenar el trabajo sin interrupciones. En la verificación visual hizo falta confirmar que el servidor servía el código actual: con un proceso de una corrida anterior o un servidor sin vigilancia de archivos, las capturas parecían correctas pero mostraban la versión previa.

## Sesión 18 — 2026-11-21 — Ajustes de UX tras la prueba en el celular (It5c)

- **Objetivo:** resolver los problemas que el usuario encontró al probar el rediseño en un iPhone con Expo Go.
- **Avances:**
  - Se levantó el entorno local para la prueba en el dispositivo: la red local y la sesión de Expo eran los bloqueos, no la aplicación.
  - Seis specs (23 a 28), un ADR y los planes de dominio, contratos y pantallas actualizados, implementados en seis ramas mergeadas a `develop`:
    - Publicar evento: el botón queda siempre habilitado; al tocarlo, el front valida, marca cada campo con su error, lleva el foco al primero y lo anuncia al lector de pantalla. El calendario no permite días pasados y los 422 del back indican el campo afectado.
    - Teclado: las pantallas con scroll se desplazan con el teclado y el teclado numérico de iOS tiene un botón "Listo".
    - Categorías: `GET /categorias` pasa a ser paginado con búsqueda sin acentos; en Nuevo evento se escribe para filtrar (con debounce) y la lista carga más al llegar al final.
    - Listas: un indicador en las filas de chips señala que hay más filtros, Mis entradas separa el título de los chips y Explorar pagina de a 6.
    - Chat: el encabezado queda fijo, la lista se invirtió y los mensajes anteriores se cargan al llegar arriba.
    - Cómo llegar: dirección obligatoria geocodificada con la API Georef (reglas R13 a R15) y un botón que abre Google Maps con la ruta.
  - Verificación: 922 tests del back, 491 del front y 5/5 flujos e2e en verde (uno nuevo); clones de código sin cambios (6).
- **Decisiones:**
  - Georef con coordenadas en lugar de abrir Maps con el texto de la dirección — misma solución que en el TPA de DSI, gratuita y pensada para direcciones argentinas — opción elegida por el usuario entre dos propuestas de la IA (ADR-014).
  - Si Georef no responde, el evento se publica sin coordenadas y el botón busca por texto — la publicación no depende de un servicio externo — propuesta de la IA, aceptada.
  - El buscador de categorías solo filtra, no crea categorías — no hay ABM de categorías en el dominio — el usuario descartó la alternativa de crearlas.
  - El encabezado fijo del chat usa el margen seguro superior en vez de quedar dentro de la lista — en iOS 26 ese margen incluye el encabezado translúcido — propuesta de la IA.
- **Aprendizaje:** el error principal ("Datos inválidos" al publicar con foto) lo había introducido la IA en la sesión anterior: actualizó el contrato para aceptar rutas relativas, pero no la validación, y ningún test creaba un evento con la ruta real de una imagen subida. Lo detectó el usuario en el celular, no la suite.

# Bitácora de uso de IA

Registro por sesión. Es la base de la conclusión del video: qué aportó la IA, qué hubo que corregir y qué se aprendió. Se completa con la skill `bitacora-ia`.

## Resumen acumulado

| Métrica | Valor |
|---|---|
| Sesiones | 8 |
| Features cerradas | 12 (It1, It2 e It3 cerradas) |
| Correcciones relevantes a la IA | 4 |
| Skills creadas / mejoradas | 10 / 1 |

### Errores típicos de la IA (se actualiza)
1. Expectativas de test mal planteadas (un caso de búsqueda que daba por ausente un texto que sí estaba en el dato).
2. Invariantes incompletos al reconstruir entidades (ids repetidos, fechas sin validar, estado modificable desde afuera), detectados por la revisión con un subagente.
3. Repetición conceptual que ni las métricas ni la revisión de reglas detectaban, hasta que se incorporó una revisión de calidad específica.
4. Código que se aparta de la spec sin actualizarla (un método no previsto) y manejo de errores demasiado amplio (descartar cualquier error en lugar de solo los de autenticación).
5. Casos borde de la librería de validación que los tests no cubren: la conversión de un parámetro vacío a número da 0 y filtraba resultados sin aviso; lo detectó el subagente revisor, no los tests escritos por la misma IA.
6. Specs que contradicen una convención del propio repo (pedir que el controlador valide el cuerpo cuando la validación vive en el middleware de la ruta) y tests de integración que no verifican el orden de los middlewares de autorización y validación.
7. Diseños escritos en la spec que fallan en una configuración que los tests no ejercitan: el servidor de Socket.io se integró con Express de una forma que solo funcionaba por websocket, y los tests se conectaban únicamente por ese transporte.

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

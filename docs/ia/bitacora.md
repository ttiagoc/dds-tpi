# Bitácora de uso de IA

Registro por sesión. Es la base de la conclusión del video: qué aportó la IA, qué hubo que corregir y qué se aprendió. Se completa con la skill `bitacora-ia`.

## Resumen acumulado

| Métrica | Valor |
|---|---|
| Sesiones | 4 |
| Features cerradas | 5 (It1 cerrada) |
| Correcciones relevantes a la IA | 4 |
| Skills creadas / mejoradas | 10 / 1 |

### Errores típicos de la IA (se actualiza)
1. Expectativas de test mal planteadas (un caso de búsqueda que daba por ausente un texto que sí estaba en el dato).
2. Invariantes incompletos al reconstruir entidades (ids repetidos, fechas sin validar, estado modificable desde afuera), detectados por la revisión con un subagente.
3. Repetición conceptual que ni las métricas ni la revisión de reglas detectaban, hasta que se incorporó una revisión de calidad específica.
4. Código que se aparta de la spec sin actualizarla (un método no previsto) y manejo de errores demasiado amplio (descartar cualquier error en lugar de solo los de autenticación).

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

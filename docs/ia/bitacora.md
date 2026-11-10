# Bitácora de uso de IA

Registro por sesión. Es la base de la conclusión del video: qué aportó la IA, qué hubo que corregir y qué se aprendió. Se completa con la skill `bitacora-ia`.

## Resumen acumulado

| Métrica | Valor |
|---|---|
| Sesiones | 2 |
| Features cerradas | 0 |
| Correcciones relevantes a la IA | 1 |
| Skills creadas / mejoradas | 9 / 0 |

### Errores típicos de la IA (se actualiza)
1. —

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

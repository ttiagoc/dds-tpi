# Bitácora de uso de IA

Registro por sesión. Es la base de la conclusión del video: qué aportó la IA, qué hubo que corregir y qué se aprendió. Se completa con la skill `bitacora-ia`.

## Resumen acumulado

| Métrica | Valor |
|---|---|
| Sesiones | 1 |
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
  - Detectó que la rama más nueva de cátedra no es `clase12` sino `clase11-integracion-front-back` y que ninguna rama usa React Native (son React web): las convenciones de front se adaptan.
  - Me hizo 13 preguntas de alcance (Expo, auth, estados, UI lib, lenguaje, tests, chat, evidencia, extras).
  - Generó 9 planes, 7 ADRs, 9 skills, 2 subagentes, AGENTS.md y CLAUDE.md.
- **Correcciones / decisiones mías:**
  - Pedí Cypress para e2e: la IA avisó que Cypress no corre apps nativas y propuso correrlo sobre Expo Web → aceptado (ADR-006).
  - La IA recomendaba polling para el chat; elegí Socket.io para aprender algo nuevo (ADR-005).
- **Tiempo:** ~1 h (estimo 4-6 h a mano para el mismo nivel de detalle).
- **Aprendizaje:** conviene fijar contratos de API y reglas de negocio por escrito antes de codear para que la IA no los invente; las skills sirven como "convenciones ejecutables".
- **Pendiente de validar:** reglas de dominio de `planes/02` (marcadas como propuesta) al escribir las specs.

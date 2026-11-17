# AGENTS.md — AI Ticket It

Guía común para cualquier agente de IA (Claude Code, Cursor, Copilot, Cline, Antigravity) que trabaje en este repo. `CLAUDE.md` la importa. Si algo de acá choca con un plan en `planes/`, manda el plan más reciente y se actualiza este archivo.

Las reglas de cada parte están en su carpeta y se leen al trabajar ahí: `backend/AGENTS.md`, `frontend/AGENTS.md`, `e2e/AGENTS.md`.

## Qué es

TP individual de Desarrollo de Software (UTN, 2C 2026). Plataforma de venta de entradas para eventos: organizadores publican eventos con tipos de entrada (precio + cupo); compradores buscan, compran, chatean por compra, cancelan y reseñan. Consigna completa en `CONSIGNA-TPI.md`.

- **Back**: Node + Express 5, ESM, JavaScript, persistencia **en memoria**.
- **Front**: React Native con **Expo** (Expo Go en el celular; también corre en web para Cypress), **React Native Paper**, expo-router.
- **Tiempo real**: Socket.io (chat de la compra).

## Mapa del repo

```
backend/            API Express (reglas en backend/AGENTS.md)
frontend/           App Expo (reglas en frontend/AGENTS.md)
e2e/                Cypress sobre Expo Web (reglas en e2e/AGENTS.md)
planes/             Planes de desarrollo (fuente de verdad del diseño)
specs/              Una spec por feature (NN-nombre.md), se escribe ANTES de codear
docs/decisiones/    ADRs
docs/ia/bitacora.md Registro de uso de IA (obligatorio, se evalúa)
.claude/            Skills transversales, subagentes y configuración de Claude Code
<parte>/.claude/    Skills propias de backend/, frontend/ y e2e/
```

Antes de tocar algo leé el plan que corresponde:

| Tema | Archivo |
|---|---|
| Arquitectura y convenciones | `planes/01-arquitectura-y-convenciones.md` |
| Dominio y reglas de negocio | `planes/02-dominio.md` |
| Contratos de API y sockets | `planes/03-api-contratos.md` |
| Pantallas | `planes/04-frontend-pantallas.md` |
| Testing | `planes/05-testing.md` |
| Roadmap | `planes/06-roadmap-iteraciones.md` |
| Uso de IA | `planes/07-ia-skills-y-evidencia.md` |

## Reglas duras

1. **No inventar contratos.** Endpoint, campo o evento de socket que no esté en `planes/03-api-contratos.md` → frenar y proponer el cambio al plan primero.
2. **No inventar reglas de negocio.** Si `planes/02-dominio.md` no la cubre, preguntar.
3. **Spec antes de código** para cada feature (`specs/_plantilla.md`).
4. **Tests con cada cambio.** Dominio y services con test unitario; endpoints con test de integración; pantallas con RNTL.
5. **Bitácora**: cada sesión de trabajo con IA deja una entrada en `docs/ia/bitacora.md`.
6. **Idioma**: dominio, nombres, mensajes de error y UI en castellano rioplatense (voseo: "No tenés permiso"). Sin comentarios obvios en el código.
7. **Nada de secretos** en el repo: `.env` ignorado, solo `.env.example`.

## Testing

| Nivel | Herramienta | Dónde |
|---|---|---|
| Unit back | Jest (ESM, `@jest/globals`) | `backend/test/{domain,services,controllers}` |
| Integración back | Jest + supertest, repos en memoria reales | `backend/test/integration` |
| Front | jest-expo + React Native Testing Library | junto a cada pantalla / componente |
| E2E | Cypress sobre Expo Web | `e2e/cypress/e2e` |

Nombres de tests en castellano, describen comportamiento: `it("rechaza cancelar una compra utilizada")`.

## Git

- Ramas: `main` (entregable), `develop` (integración), trabajo en `feature/*`, `fix/*`, `docs/*`, `chore/*` (kebab-case). Merge local a `develop` con `--no-ff`. Detalle en `GITFLOW.md`.
- Commits: una línea en castellano, tercera persona presente: "Agrega búsqueda de eventos por categoría".

## Definición de terminado

- [ ] Spec de la feature con criterios de aceptación cumplidos.
- [ ] Tests nuevos + suite completa en verde; `npm run calidad` sin errores (lint + duplicados) y revisión con `revisar-calidad`.
- [ ] Swagger actualizado si cambió la API.
- [ ] Pantalla probada en Expo Go (y web si tiene e2e).
- [ ] Entrada en `docs/ia/bitacora.md`; ADR si hubo una decisión.

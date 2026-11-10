# AGENTS.md — AI Ticket It

Guía común para cualquier agente de IA (Claude Code, Cursor, Copilot, Cline, Antigravity) que trabaje en este repo. `CLAUDE.md` la importa. Si algo de acá choca con un plan en `planes/`, manda el plan más reciente y se actualiza este archivo.

## Qué es

TP individual de Desarrollo de Software (UTN, 2C 2026). Plataforma de venta de entradas para eventos: organizadores publican eventos con tipos de entrada (precio + cupo); compradores buscan, compran, chatean por compra, cancelan y reseñan. Consigna completa en `CONSIGNA-TPI.md`.

- **Back**: Node + Express 5, ESM, JavaScript, persistencia **en memoria**.
- **Front**: React Native con **Expo** (Expo Go en el celular; también corre en web para Cypress), **React Native Paper**, expo-router.
- **Tiempo real**: Socket.io (chat de la compra).

## Mapa del repo

```
backend/            API Express (ver "Backend")
frontend/           App Expo (ver "Frontend")
e2e/                Cypress sobre Expo Web
planes/             Planes de desarrollo (fuente de verdad del diseño)
specs/              Una spec por feature (NN-nombre.md), se escribe ANTES de codear
docs/decisiones/    ADRs
docs/ia/bitacora.md Registro de uso de IA (obligatorio, se evalúa)
.claude/skills/     Skills del proyecto
.claude/agents/     Subagentes del proyecto
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

## Reglas duras

1. **No inventar contratos.** Endpoint, campo o evento de socket que no esté en `planes/03-api-contratos.md` → frenar y proponer el cambio al plan primero.
2. **No inventar reglas de negocio.** Si `planes/02-dominio.md` no la cubre, preguntar.
3. **Spec antes de código** para cada feature (`specs/_plantilla.md`).
4. **Tests con cada cambio.** Dominio y services con test unitario; endpoints con test de integración.
5. **Bitácora**: cada sesión de trabajo con IA deja una entrada en `docs/ia/bitacora.md`.
6. **Idioma**: dominio, nombres, mensajes de error y UI en castellano rioplatense (voseo: "No tenés permiso"). Sin comentarios obvios en el código.
7. **Nada de secretos** en el repo: `.env` ignorado, solo `.env.example`.

## Backend

Estructura `backend/src/`:

| Carpeta | Contenido | Archivo ejemplo |
|---|---|---|
| `domain/` | Clases con comportamiento; validan en constructor y tiran `UnprocessableEntityError`. Enums `Object.freeze` en archivo propio. | `Compra.js`, `EstadoCompra.js` |
| `repositories/` | En memoria, **API async** (devuelven Promise) para que se puedan cambiar por Mongo. Base `InMemoryRepository` (Map + nextId). | `CompraRepository.js` |
| `services/` | Lógica de aplicación. DI por constructor con default. `toResponse(entidad)` es el DTO. | `CompraService.js` |
| `controllers/` | `extends BaseController` (`parsearId`, `extraerYValidarQuery`). `try { … } catch (e) { next(e) }`. | `CompraController.js` |
| `routes/` | `XRoutes.js`, `router.js` monta todo. | `CompraRoutes.js` |
| `validations/` | Zod `.strict()`; middleware `validate(schema)`. | `compraValidation.js` |
| `middlewares/` | `errorHandler`, `errorLogger`, `notFoundHandler`, `autenticar`, `autenticarOpcional`, `autorizar`, `validate`. | |
| `errors/` | `AppError` + `BadRequest 400`, `Unauthorized 401`, `Forbidden 403`, `NotFound 404`, `Conflict 409`, `UnprocessableEntity 422`. | `AppError.js` |
| `docs/openapi/` | Swagger modular a mano: `<modulo>.js` exporta `{ tags, paths, schemas }`; `comun.js` helpers. | |
| `sockets/` | Servidor Socket.io (auth JWT en handshake, rooms `compra:<id>`). | |
| `seeds/` | `datos.js` + `sembrar.js`. Se siembra al arrancar. | |
| `config/` | `reloj.js` (`ahora()` inyectable para tests de fechas), `entorno.js`. | |
| `contenedor.js` | `crearContenedor(overrides)`: repos únicos inyectados explícitamente en los services, `resetear()`. | |

Convenciones:
- Archivos de clase en PascalCase; schemas, validaciones y middlewares en camelCase. Imports con extensión `.js`.
- Métodos CRUD en inglés (`findById`, `save`, `getById`, `create`); dominio y helpers en castellano (`cancelar()`, `hayCupoPara()`, `parsearId`).
- Endpoints: sustantivos en plural, camelCase, sin prefijo `/api`. Acciones como sub-recurso con POST (`/compras/:id/cancelacion`).
- Respuestas sin wrapper. Listas paginadas: `{ eventos: [...], total, page, totalPages }`. Errores: `{ status: "fail" | "error", message, details?, timestamp }`.
- Status: 200 GET/acciones, 201 creación, 204 delete sin cuerpo, 400 input inválido, 401 sin token, 403 sin permiso, 404, 409 conflicto, 422 regla de negocio.
- Fechas en ISO 8601 UTC en el JSON.

## Frontend

Estructura `frontend/`:

```
src/app/             expo-router (rutas = archivos)
  (auth)/login.jsx
  (comprador)/       tabs del comprador
  (organizador)/     tabs del organizador
  eventos/[id].jsx  compras/[id].jsx  compras/[id]/chat.jsx ...
src/pantallas/       UI y lógica de cada pantalla + su test (src/app/ solo importa)
src/api/             cliente.js (axios + token + mensajeDeError), <recurso>Api.js, socket.js
src/auth/            AuthContext (useAuth), almacenamiento de sesión
src/components/      componentes compartidos
src/hooks/           hooks (useChatCompra, useCargar…)
src/tema/            tema Paper + tokens
```

Reglas:
- Solo componentes de **React Native Paper** (y primitivas RN para layout). Colores y espaciados desde el tema (`useTheme()` / `src/tema`), nunca hex sueltos.
- Las pantallas nunca llaman axios/fetch: siempre `src/api/<recurso>Api.js`.
- El usuario sale de `useAuth()`.
- Cada pantalla maneja estados: cargando, error, vacío, enviando, éxito.
- Todo elemento interactivo o verificable tiene `testID` (Cypress lo ve como `data-testid`) y `accessibilityLabel` si es solo ícono.
- URL del back: `EXPO_PUBLIC_API_URL` (en el celular, IP LAN de la PC, no `localhost`).

## Testing

| Nivel | Herramienta | Dónde |
|---|---|---|
| Unit back | Jest (ESM, `@jest/globals`) | `backend/test/{domain,services,controllers}` |
| Integración back | Jest + supertest, repos en memoria reales | `backend/test/integration` |
| Front | jest-expo + React Native Testing Library | junto a cada pantalla / componente |
| E2E | Cypress sobre Expo Web | `e2e/cypress/e2e` |

Nombres de tests en castellano: `it("rechaza cancelar una compra utilizada")`. Factories en `backend/test/helpers/domainFactories.js`.

## Git

- Ramas: `main` (entregable), `develop` (integración), trabajo en `feature/*`, `fix/*`, `docs/*`, `chore/*` (kebab-case). Merge local a `develop` con `--no-ff`. Detalle en `GITFLOW.md`.
- Commits: una línea en castellano, tercera persona presente: "Agrega búsqueda de eventos por categoría".

## Definición de terminado

- [ ] Spec de la feature con criterios de aceptación cumplidos.
- [ ] Tests nuevos + suite completa en verde; `npm run calidad` sin errores (lint + duplicados) y revisión con `revisar-calidad`.
- [ ] Swagger actualizado si cambió la API.
- [ ] Pantalla probada en Expo Go (y web si tiene e2e).
- [ ] Entrada en `docs/ia/bitacora.md`; ADR si hubo una decisión.

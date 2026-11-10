# 06 — Roadmap por iteraciones

Plazo: ~3 semanas desde 2026-11-10. Cada feature: `escribir-spec` → `feature/<x>` → TDD → `cerrar-feature` → merge a `develop`. Cierre de iteración: merge a `main` + tag `itN`.

## It0 — Setup (10-11/11)
- [x] Planes, AGENTS.md, CLAUDE.md, GITFLOW, README
- [x] Skills y subagentes del proyecto
- [x] ADRs iniciales, bitácora
- [x] Skills externas: Expo y Callstack (React Native)
- [x] `chore/tooling`: dependencias de raíz, back y front; ESLint, Prettier, Cypress; scaffold Expo SDK 58 con expo-router y Paper

**Aceptación:** cada CU tiene fila en la trazabilidad de `00-indice.md`.

## It1 — Backend base (11-14/11)
Specs: `01-backend-base`, `02-dominio`, `03-repos-y-seed`, `04-auth`.
- [x] `chore/backend-base`: package.json ESM, express 5, app/server, errores, middlewares, healthcheck, Jest ESM, reloj, contenedor.
- [x] `feature/dominio`: todas las clases de `planes/02` + tests unitarios (TRANSICIONES, cupo, días restantes, reseñas).
- [x] `chore/calidad-codigo`: skill `revisar-calidad`, `npm run calidad` (ESLint de complejidad/tamaño + Prettier + jscpd), integrada a `cerrar-feature`; primera pasada sobre lo mergeado.
- [x] `feature/repos-y-seed`: `InMemoryRepository`, repos, `datos.js`, `sembrar.js`, `/test/reset`.
- [x] `feature/auth`: login JWT, `autenticar`, `autorizar`, `/auth/yo`.

**Aceptación:** `npm test` verde; `POST /auth/login` con usuarios seed devuelve token; dominio con cobertura ≥ 80%.

## It2 — API (14-18/11)
Specs: `05-eventos-consulta`, `05b-eventos-organizador`, `06-compras-comprador`, `06b-compras-organizador`, `07-resenias-favoritos`.
- [x] `feature/eventos-consulta`: `GET /categorias`, `GET /eventos` (q, categoria, precio, orden, paginado), `GET /eventos/:id`.
- [x] `feature/eventos-organizador`: `POST /eventos` (categoría inexistente → 422), `GET /organizadores/yo/eventos`.
- [x] `feature/compras-comprador`: crear (cantidad 1-10), listar mías (próximas primero) con `diasRestantes` y `acciones`, detalle con historial, pago, cancelación/reembolso.
- [x] `feature/compras-organizador`: marcar utilizada, `GET /eventos/:id/compras` con disponibilidad.
- [x] `feature/resenias-favoritos`: reseñas, puntaje promedio, ordenar por puntaje, favoritos.
- [x] `docs/swagger` (spec `07b-swagger`): OpenAPI modular.

**Aceptación:** colección de integración cubre cada endpoint de `planes/03`; Swagger muestra todos.

## It3 — Chat (18-19/11)
Specs: `08-chat-rest`, `08b-chat-socket`.
- [x] `feature/chat-rest`: GET/POST mensajes con permisos.
- [x] `feature/chat-socket`: socket.io con auth, rooms, emisión `mensaje:nuevo` y `compra:estado`.

**Aceptación:** dos clientes de prueba (script o test) reciben el mensaje en vivo.

## It4 — App Expo (19-26/11)
Specs: `09-front-base`, `10-pantallas-comprador`, `11-pantallas-organizador`, `12-chat-front`.
- [ ] `chore/front-base`: create-expo-app, expo-router, Paper + tema, cliente axios, sesión (secure-store/localStorage), AuthContext, layouts por rol, componentes base, jest-expo.
- [ ] `feature/login`
- [ ] `feature/explorar-eventos` (CU3, CU11) + DetalleEvento (CU10)
- [ ] `feature/comprar` (CU12)
- [ ] `feature/mis-compras` (CU1) + DetalleCompra + acciones (CU7, CU8)
- [ ] `feature/resenar` (CU9) + `feature/favoritos`
- [ ] `feature/organizador` (CU2, CU4)
- [ ] `feature/chat-front` (CU5, CU6)

**Aceptación:** todos los CU recorribles en Expo Go en el celular; tests RNTL de Explorar, Comprar, MisCompras, DetalleCompra.

## It5 — Calidad (26-29/11)
- [ ] `chore/e2e-cypress`: setup + 3 flujos.
- [ ] `chore/docker-back`: Dockerfile + `.dockerignore`.
- [ ] `fix/pulido-ui`: revisión con `sistema-diseno`, modo oscuro, accesibilidad.
- [ ] Revisión con subagente `revisor-reglas-negocio` y `/code-review`.

**Aceptación:** `npm test` (back y front) y `npm run e2e` verdes; demo completa en celular sin errores.

## It6 — Entrega (29/11-1/12)
- [ ] Guion final (`planes/08`), ensayo, grabación 5-10 min.
- [ ] Conclusión armada desde `docs/ia/bitacora.md`.
- [ ] Merge final a `main`, tag `entrega`.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Expo Go no llega al back (red/firewall) | IP LAN en `.env`, regla de firewall para puerto 3000; plan B: túnel `npx expo start --tunnel` + back expuesto (ngrok) o emulador |
| Diferencias web vs nativo (Cypress) | Usar solo componentes Paper; evitar APIs nativas sin fallback; probar ambas al cerrar cada pantalla |
| Versiones nuevas que la IA no conoce (Expo SDK, Paper, Express 5) | Skills externas de Expo + leer docs oficiales; registrar en bitácora cada alucinación |
| Socket.io en Expo Go | `transports: ["websocket"]`; fallback a polling REST con refresco manual |
| Persistencia en memoria se pierde al reiniciar | Seed rico al arrancar; `/test/reset` para e2e |

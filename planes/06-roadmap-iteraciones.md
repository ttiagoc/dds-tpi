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
Specs: `09-front-base` (incluye login), `10-explorar-eventos`, `10b-comprar`, `10c-mis-compras`, `10c2-acciones-compra`, `10d-resenar-favoritos`, `11-pantallas-organizador`, `11b-crear-evento`, `12-chat-front`.
- [x] `chore/front-base`: create-expo-app, expo-router, Paper + tema, cliente axios, sesión (secure-store/localStorage), AuthContext, layouts por rol, componentes base, jest-expo y pantalla Login (absorbe `feature/login`).
- [x] `feature/explorar-eventos` (CU3, CU11) + DetalleEvento (CU10)
- [x] `feature/comprar` (CU12)
- [x] `feature/mis-compras` (CU1): MisCompras + DetalleCompra de solo lectura con `LineaDeTiempo`
- [x] `feature/acciones-compra` (CU7, CU8): pagar y cancelar desde DetalleCompra
- [x] `feature/resenar-favoritos` (CU9) + tab Favoritos
- [x] `feature/organizador` (CU2): MisEventos, ComprasDelEvento y Marcar utilizada
- [x] `feature/crear-evento` (CU4)
- [x] `feature/chat-front` (CU5, CU6)

**Aceptación:** todos los CU recorribles en Expo Go en el celular; tests RNTL de Explorar, Comprar, MisCompras, DetalleCompra.

## It5 — Calidad (26-29/11)
- [x] `chore/e2e-cypress` (spec 13): setup + 3 flujos. Cypress 16 quitó `Cypress.env()`: migrar `cy.resetDatos()` (`e2e/cypress/support/commands.js`) a `Cypress.expose()`.
- [x] `chore/docker-back` (spec 14, ADR-010): Dockerfile + `.dockerignore`.
- [x] `fix/pulido-ui` (spec 15): revisión con `sistema-diseno`, modo oscuro, accesibilidad.
- [x] Revisión con subagente `revisor-reglas-negocio` y `/code-review` (spec 16).

**Aceptación:** `npm test` (back y front) y `npm run e2e` verdes; demo completa en celular sin errores.

## It5b — Rediseño (19-22/11)
Specs: `18-paginacion-favoritos-chat`, `19-identidad-visual`, `20-bandeja-mensajes`, `21-subir-imagen-evento`, `22-rediseno-pantallas`. Maquetas aprobadas antes de codear (ADR-012).
- [x] `feature/paginacion-favoritos-chat` (spec 18): favoritos con `page/limit`, chat con cursor `antesDe`.
- [x] `feature/identidad-visual` (spec 19): tokens, Manrope, componentes compartidos.
- [x] `feature/bandeja-mensajes` (spec 20): no leídos (R11, R12), pestaña Mensajes con badge en vivo.
- [x] `feature/subir-imagen-evento` (spec 21, ADR-013): `POST /imagenes` y portada desde la galería.
- [x] `feature/rediseno-pantallas` (spec 22): cada pantalla según las maquetas.

**Aceptación:** suites y e2e verdes; recorrido completo en Expo Go en claro y oscuro.

## It5c — Ajustes tras la prueba en Expo Go (21/11-)
Specs 23-28, ADR-014. Hallazgos de la prueba en el celular.
- [x] `fix/publicar-evento` (spec 23): `multimedia` con rutas relativas, validación en el front con foco en el primer error, `details` en los 422.
- [x] `fix/teclado-formularios` (spec 24): `Pantalla` sube con el teclado, `CampoNumero` con "Listo".
- [x] `feature/selector-categoria` (spec 25): `GET /categorias` paginado con `q`, buscador en Nuevo evento.
- [x] `feature/chips-y-listas` (spec 26): chevron en los chips, espacio en Mis entradas, Explorar de a 6.
- [x] `fix/chat-encabezado-fijo` (spec 27): encabezado fijo, lista invertida, anteriores al subir.
- [x] `feature/como-llegar` (spec 28, ADR-014): dirección geocodificada con Georef y botón "Cómo llegar".

Segunda tanda (specs 29-31), tras probar en el iPhone:
- [ ] `fix/ajustes-chips-chat-teclado` (spec 29): flechas visibles a los dos lados, encabezado propio del chat, teclado numérico con tecla de confirmar.
- [ ] `feature/selector-de-tema` (spec 30): Claro / Oscuro / Automático en Perfil, por defecto Claro.
- [ ] `feature/direccion-con-mapa` (spec 31): dirección por campos, `GET /direcciones/ubicacion` y confirmación en el mapa.

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

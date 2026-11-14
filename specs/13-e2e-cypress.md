# Spec 13 — Flujos e2e con Cypress

- **Estado:** aprobada
- **Rama:** `chore/e2e-cypress`
- **Casos de uso:** CU1, CU3, CU12 (flujo de compra); CU9 (utilizada y reseña); CU5, CU6 (chat) (ver `planes/00-indice.md`)
- **Iteración:** It5
- **Depende de:** ADR-006 (Cypress sobre Expo Web), specs 10 a 12 (pantallas y testIDs), `POST /test/reset` (solo `NODE_ENV=test`)

## Contexto

Hasta ahora cada rama de front se verificó con un Cypress temporal que se borraba al cerrar. It5 deja **3 flujos permanentes** que recorren la app web contra el back real, para correr con `npm run e2e` antes de cada cierre y en la demo.

Además hay que poner al día la infraestructura:
- Cypress 16 quitó `Cypress.env()` (deprecado en 15.10, eliminado en 16.0). Los valores públicos se declaran en la clave raíz `expose` de `cypress.config.js` y se leen con `Cypress.expose("clave")`; se pisan por CLI con `--expose clave=valor`. `cy.env()` queda solo para secretos (acá no hay: la URL del back es pública). Verificado en la documentación oficial (`docs.cypress.io/api/cypress-api/expose`) y en los tipos de `cypress@16.2.1` instalado.
- Los Cypress temporales repetían el login por la UI: pasa a un comando.
- `npm run e2e` tiene que andar en Windows.

## Historias

- Como desarrollador, quiero correr `npm run e2e` y que tres flujos clave pasen contra el back real, para detectar regresiones de integración front + back antes de mergear.
- Como desarrollador, quiero levantar los servidores de e2e con un solo comando (`npm run e2e:servidores`), sin recordar variables de entorno.

## Reglas de negocio

No agrega reglas. Los flujos ejercitan las existentes de `planes/02-dominio.md`:
- R1/CU12: compra con cupo nace PENDIENTE.
- R4 (ADR-007): el organizador marca utilizada una compra CONFIRMADA, aunque el evento no haya ocurrido.
- R5: el comprador dueño reseña una compra UTILIZADA.
- Chat: solo participantes; `mensaje:nuevo` al room `compra:<id>` incluido el autor (spec 08b).

## Contrato de API

Sin cambios. Usa:
- `POST /test/reset` (204) en el `beforeEach`.
- `POST /auth/login` y `POST /compras/:id/mensajes` vía `cy.request` solo para que Fénix responda en el flujo de chat mientras Ana tiene la pantalla abierta (Cypress maneja un solo navegador).

## Infraestructura

| Pieza | Cambio |
|---|---|
| `e2e/cypress.config.js` | `env: { apiUrl }` → clave raíz `expose: { apiUrl: "http://localhost:3000" }`. Sin `viewport` por test: queda el `viewportWidth/Height` 375×812 de la config. |
| `e2e/cypress/support/commands.js` | `cy.resetDatos()` usa `Cypress.expose("apiUrl")`. Nuevos: `cy.ingresar(email)` (visita `/`, completa `login-email` y `login-password` con la contraseña demo del seed, `login-ingresar`, espera que desaparezca el login); `cy.salir()` (tab Perfil/Cuenta → `cerrar-sesion`, espera `login-email`); `cy.tid(id)` se mantiene. Un helper `iniciarSesionApi(email)` para `cy.request` del chat. |
| `e2e/cypress/e2e/` | Un archivo por flujo: `comprar-entrada.cy.js`, `utilizada-y-resenia.cy.js`, `chat-compra.cy.js`. |
| `e2e/correr-cypress.mjs` | Corre en Windows desde PowerShell, cmd y Git Bash (hoy falla desde Git Bash). |
| `package.json` (raíz) | `e2e` sigue corriendo solo Cypress. Nuevo `e2e:servidores`: back con `NODE_ENV=test` + `expo start --web` con `EXPO_PUBLIC_API_URL=http://localhost:3000`, multiplataforma (sin `VAR=x` de shell). |

Datos: los flujos usan el seed (`Demo1234!` para todos). Compra `ana-primavera` (Festival Primavera Sonora, CONFIRMADA, organizador Fénix). Para el flujo de compra, un evento futuro del seed sin compras previas de Ana, así la tarjeta nueva se distingue sin ambigüedad.

## Pantallas

Sin cambios de UI previstos. Si a algún flujo le falta un `testID` para una aserción estable, se agrega en la pantalla (con su test RNTL si cambia comportamiento) y se anota acá. Aserciones acotadas al contenedor (`cy.tid("lista-...").within(...)`) porque en web las tabs inactivas siguen montadas. Navegación siempre por la UI (el deep link en frío cae a las tabs).

## Criterios de aceptación

```gherkin
Escenario: Ana busca, compra y ve la compra pendiente
  Dado que los datos se resetearon
  Y Ana ingresó por la UI
  Cuando busca el evento por texto en Explorar, abre su detalle y compra 2 entradas de un tipo
  Entonces en Mis compras, dentro de "lista-compras", aparece la compra de ese evento con estado "Pendiente"

Escenario: Fénix marca utilizada una compra y Ana la reseña
  Dado que los datos se resetearon
  Y Fénix ingresó por la UI
  Cuando abre "Festival Primavera Sonora" desde Mis eventos, abre la compra confirmada de Ana y la marca utilizada
  Entonces la compra queda "Utilizada"
  Cuando Fénix cierra sesión y Ana ingresa, abre esa compra en Mis compras y la reseña con 4 estrellas y un comentario
  Entonces el detalle de la compra muestra su reseña

Escenario: Ana escribe en el chat y recibe la respuesta en vivo
  Dado que los datos se resetearon
  Y Ana ingresó por la UI y abrió el chat de su compra de "Festival Primavera Sonora"
  Cuando envía un mensaje
  Entonces lo ve en "lista-mensajes"
  Cuando Fénix responde por la API
  Entonces Ana ve la respuesta en "lista-mensajes" sin recargar
  Cuando Ana cierra sesión y Fénix ingresa y abre el chat de esa compra
  Entonces Fénix ve el mensaje de Ana

Escenario: el back no está en modo test
  Dado que el back corre sin NODE_ENV=test
  Cuando corre cualquier flujo
  Entonces falla en el beforeEach por el reset (404), sin tocar datos
```

## Plan de tests

| Nivel | Caso |
|---|---|
| E2E | Los 3 flujos de arriba, uno por archivo, `beforeEach(cy.resetDatos)` |
| Front (RNTL) | Solo si se agrega un `testID` o se toca una pantalla |
| Back | Sin cambios (`/test/reset` ya tiene test de integración) |

Verificación: `npm run e2e` 3/3 desde la raíz en Windows, con `npm run e2e:servidores` en otra terminal; `npm test` de back y front; `npm run calidad` (lint y prettier incluyen `e2e/`; quedan los 7 clones conocidos del back).

## Fuera de alcance

- Que `npm run e2e` levante y baje los servidores (decidido: servidores aparte).
- Cancelar, pagar, favoritos, crear evento en e2e (cubiertos por RNTL y por los Cypress temporales de cada rama).
- CI (no hay pipeline).
- Diferencias Android/iOS: se prueban a mano en Expo Go (ADR-006).
- `cy.login` por `localStorage` (plan 05 original): se reemplaza por `cy.ingresar` por UI.

## Notas de IA

- La IA verificó la API de `Cypress.expose` en la documentación oficial y en los tipos de la versión instalada, no de memoria: `expose` va en la raíz de la config (no dentro de `e2e`) y `CYPRESS_*` no alimenta `expose`.
- La IA señaló que el pedido difería de `planes/05-testing.md` (flujos distintos y `cy.login` por `localStorage`); se actualizó el plan.
- Decisiones del usuario: el flujo de compra termina en PENDIENTE; el chat combina UI + respuesta de Fénix por API (prueba el socket) + verificación secuencial con login de Fénix; cambio de usuario cerrando sesión por la UI; servidores aparte con `npm run e2e:servidores`.

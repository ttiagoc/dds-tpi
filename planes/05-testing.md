# 05 — Testing

## Pirámide

| Nivel | Qué valida | Herramienta | Cantidad esperada |
|---|---|---|---|
| Unit — dominio | reglas puras (`Compra`, `TipoEntrada`, `Evento`, transiciones) | Jest | muchos, rápidos |
| Unit — services | casos de uso con repos fake, permisos, `toResponse` | Jest + `jest.fn()` | uno por caso de uso + errores |
| Unit — controllers/middlewares | status codes, parseo, `next(error)` | Jest con `req/res` fake | los no triviales |
| Integración back | HTTP real contra app con repos en memoria reales | Jest + supertest | uno por endpoint (feliz + errores principales) |
| Front | pantallas renderizan estados y llaman a la API correcta | jest-expo + RNTL, API mockeada | pantallas core |
| E2E | flujo usuario completo, front web + back real | Cypress | 3-4 flujos |

## Backend

```json
"scripts": {
  "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
  "test:watch": "npm test -- --watch",
  "test:cov": "npm test -- --coverage"
}
```

- `import { describe, it, expect, jest, beforeEach } from "@jest/globals";`
- Factories: `test/helpers/domainFactories.js` → `crearUsuario(overrides)`, `crearEvento(overrides)`, `crearCompra(overrides)`.
- Reloj fijo: `const reloj = { ahora: () => new Date("2026-11-15T12:00:00Z") }`.
- Integración: `crearContenedor({ reloj })` + `await contenedor.resetear()` (mismo seed que la demo, `seeds/datos.js`) + `crearApp(contenedor, { nodeEnv: "test" })`; token con helper `loginComo(app, email)`.
- Cobertura ≥ 80% en `domain/` y `services/`, **forzada** con `coverageThreshold` en la config de Jest (`npm run test:cov` falla si baja).
- Auth (middlewares + integración): sin header → 401; header sin `Bearer` → 401; token mal formado → 401; token vencido → 401; rol incorrecto → 403; `autenticarOpcional` con token inválido → sigue anónimo.
- Arranque: `config/entorno.js` sin `JWT_SECRET` fuera de test → error.

Ejemplo de nombre: `describe("Compra") > describe("cancelar") > it("pasa a REEMBOLSADA si estaba CONFIRMADA")`.

## Frontend

- `jest-expo` preset, `@testing-library/react-native`, `jest.mock("../src/api/comprasApi")`.
- Wrapper `renderConProviders(ui, { usuario })` con `PaperProvider` + `AuthProvider` sembrado.
- Consultas por `getByRole`, `getByText`, `getByLabelText`; `getByTestId` solo cuando no hay alternativa.
- Casos mínimos por pantalla: muestra datos, muestra error del back, acción principal llama a la API con los argumentos correctos.

## E2E (Cypress sobre Expo Web)

```
e2e/
  cypress.config.js     baseUrl http://localhost:8081, expose.apiUrl http://localhost:3000 (raíz de la config)
  cypress/support/commands.js   cy.resetDatos(), cy.ingresar(email), cy.salir(), cy.irATab(tab), cy.abrirMiCompra(evento), cy.abrirCompraDelEvento(evento, comprador), cy.enviarMensajeComo(email, compraId, texto), cy.tid(id) → cy.get(`[data-testid="${id}"]`)
  cypress/e2e/
    comprar-entrada.cy.js       Ana busca → detalle → compra → ve la compra PENDIENTE en Mis compras
    utilizada-y-resenia.cy.js   Fénix marca utilizada la compra de Ana → Ana la reseña y ve su reseña
    chat-compra.cy.js           Ana escribe en el chat → Fénix responde por API y Ana lo ve en vivo → Fénix entra y ve el mensaje
```

- Spec 13. Back levantado con `NODE_ENV=test` para habilitar `POST /test/reset`; `beforeEach(cy.resetDatos)`.
- Cypress 16 quitó `Cypress.env()`: valores públicos en `expose` y `Cypress.expose("apiUrl")`.
- `cy.ingresar(email)` hace el login por la UI con la contraseña demo del seed; `cy.salir()` cierra sesión desde Perfil/Cuenta.
- Viewport mobile 375×812 desde la config.
- En web las tabs inactivas siguen montadas: acotar aserciones al contenedor (`cy.tid("lista-...").within`). Navegar por la UI (los flujos prueban lo que hace el usuario); desde la spec 16 una recarga o deep link en frío conserva la ruta.
- react-native-web traduce `testID` → `data-testid`.

## Comandos

```bash
cd backend && npm test
cd frontend && npm test
# e2e: terminal 1 (back NODE_ENV=test + expo web)
npm run e2e:servidores
# terminal 2
npm run e2e
```

(`e2e:servidores` es multiplataforma: no hace falta `$env:NODE_ENV` en PowerShell.)

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
  cypress.config.js     baseUrl http://localhost:8081, env.apiUrl http://localhost:3000
  cypress/support/commands.js   cy.resetDatos(), cy.login(email), cy.tid(id) → cy.get(`[data-testid="${id}"]`)
  cypress/e2e/
    comprar-entrada.cy.js       buscar → filtrar → detalle → comprar → ver en Mis compras (PENDIENTE) → pagar
    cancelar-compra.cy.js       compra CONFIRMADA → cancelar → REEMBOLSADA y cupo liberado
    organizador-compras.cy.js   login organizador → evento → disponibilidad + compras por estado → marcar utilizada
    chat.cy.js (opcional)       enviar mensaje y verlo en la lista
```

- Back levantado con `NODE_ENV=test` para habilitar `POST /test/reset`; `beforeEach(cy.resetDatos)`.
- `cy.login` hace `POST /auth/login` y guarda la sesión en `localStorage` (la key que usa `src/auth/sesion.js` en web) para no pasar por la UI en cada test (salvo el test de login).
- Viewport mobile: `cy.viewport("iphone-x")`.
- react-native-web traduce `testID` → `data-testid`.

## Comandos

```bash
cd backend && npm test
cd frontend && npm test
# e2e: terminal 1
cd backend && NODE_ENV=test npm start
# terminal 2
cd frontend && npx expo start --web
# terminal 3
npm run e2e
```

(En PowerShell: `$env:NODE_ENV="test"; npm start`.)

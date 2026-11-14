---
name: escribir-tests
description: Usar al escribir o arreglar tests en AI Ticket It - unitarios de dominio/services/controllers (Jest ESM), integración HTTP (supertest), pantallas (jest-expo + React Native Testing Library) o e2e (Cypress sobre Expo Web). Fija ubicación, nombres, helpers y qué cubrir en cada nivel.
---

# Escribir tests

Estrategia completa en `planes/05-testing.md`. Preferir TDD: test en rojo → implementación → verde.

## Nombres

Castellano, describen comportamiento: `describe("Compra") > describe("cancelar") > it("pasa a REEMBOLSADA si estaba CONFIRMADA")`.

## Backend — unit

```js
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { crearCompra, crearEvento } from "../helpers/domainFactories.js";

const AHORA = new Date("2026-11-15T12:00:00Z");

describe("Compra", () => {
  describe("cancelar", () => {
    it("rechaza cancelar una compra utilizada", () => {
      const compra = crearCompra({ estado: "UTILIZADA" });
      expect(() => compra.cancelar(compra.comprador.id, AHORA)).toThrow(UnprocessableEntityError);
    });
  });
});
```

- Dominio: sin mocks. Fechas fijas (`AHORA`), nunca `new Date()` sin argumentos.
- Services: repos fake con `jest.fn().mockResolvedValue(...)`, reloj `{ ahora: () => AHORA }`, notificador `{ mensajeNuevo: jest.fn() }`. Verificar: valor devuelto (forma `toResponse`), error tirado (`rejects.toThrow(ForbiddenError)`), que `save` se llamó o **no** se llamó.
- Controllers: `req` armado a mano, `res = crearRes()` (status/json/send devuelven `res`), `next = jest.fn()`; verificar status y `next(expect.any(BadRequestError))`.

## Backend — integración

```js
import request from "supertest";
const contenedor = crearContenedor({ reloj: { ahora: () => AHORA } });
await sembrar(contenedor, datosDePrueba);
const app = crearApp(contenedor);
const token = await loginComo(app, "ana@aiticket.com");

const res = await request(app).post("/compras").set("Authorization", `Bearer ${token}`)
  .send({ eventoId: 1, tipoEntradaId: 1, cantidad: 2 });
expect(res.status).toBe(201);
expect(res.body.estado).toBe("PENDIENTE");
```

- Contenedor nuevo por archivo/`beforeEach` → sin estado compartido entre tests.
- Por endpoint: feliz + los errores del contrato (400/401/403/404/409/422 que apliquen).

## Frontend — RNTL

```js
import { screen, fireEvent, waitFor } from "@testing-library/react-native";
jest.mock("../../api/comprasApi");

it("muestra los días que faltan para una compra confirmada", async () => {
  obtenerMisCompras.mockResolvedValue({ compras: [compraConfirmada], total: 1, page: 1, totalPages: 1 });
  renderConProviders(<MisCompras />, { usuario: ana });
  expect(await screen.findByText("Faltan 12 días")).toBeTruthy();
});
```

- Mock de la capa `src/api/*`, nunca de axios.
- Mínimo por pantalla: datos, error del back, acción principal.
- `expo-router`: mockear `useRouter`/`useLocalSearchParams` en `jest.setup.js`.

## E2E — Cypress (Expo Web)

```js
describe("Comprar una entrada", () => {
  beforeEach(() => {
    cy.resetDatos();
    cy.ingresar("ana@aiticket.com");
  });

  it("busca un evento, compra 2 entradas y ve la compra pendiente en Mis compras", () => {
    cy.tid("buscador").type("Maratón");
    cy.tid("lista-eventos").contains("Maratón Nocturna").click();
    cy.tid("evento-comprar").click();
    cy.contains('[data-testid^="tipo-"]:visible', "Inscripción").click();
    cy.tid("cantidad-mas").click();
    cy.tid("comprar-confirmar").click();
    cy.tid("compra-estado").should("contain", "Pendiente");
  });
});
```

- Selectores solo por `testID` (`cy.tid`) o texto visible. Nunca clases CSS (react-native-web las genera).
- Comandos (`e2e/cypress/support/commands.js`): `cy.resetDatos()` → `POST {apiUrl}/test/reset` (back con `NODE_ENV=test`); `cy.ingresar(email)` login por la UI con la contraseña demo; `cy.salir()` cierra sesión desde Perfil; `cy.irATab(tab)` vuelve a las tabs con `cy.visit("/")` (no encadenar `cy.go("back")`); `cy.abrirMiCompra(evento)` y `cy.abrirCompraDelEvento(evento, comprador)` navegan hasta el detalle; `cy.enviarMensajeComo(email, compraId, texto)` para simular a la otra parte del chat.
- Cypress 16 quitó `Cypress.env()`: valores públicos en la clave raíz `expose` de la config y `Cypress.expose("apiUrl")`.
- En web las pantallas de abajo del stack y las tabs inactivas siguen montadas: acotar al contenedor (`cy.tid("lista-...")`) o filtrar `:visible`. Navegar por la UI (el deep link en frío cae a las tabs).
- Un flujo de negocio por archivo; verificar resultado visible para el usuario, no detalles internos.
- Si un test falla de forma intermitente: esperar por contenido (`should`) en vez de `cy.wait(ms)`.
- Correr: `npm run e2e:servidores` en una terminal y `npm run e2e` en otra (anda en PowerShell y Git Bash).

## Antes de dar por terminado

Correr la suite completa del módulo, no solo el archivo nuevo, y mostrar la salida.

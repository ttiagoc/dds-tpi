---
name: escribir-tests
description: Usar al escribir o arreglar tests e2e de AI Ticket It (Cypress sobre Expo Web). Fija selectores, comandos propios, cómo levantar los servidores y qué verificar.
---

# Escribir tests e2e

Estrategia completa en `planes/05-testing.md`. Preferir TDD: test en rojo → implementación → verde.

## Nombres

Castellano, describen comportamiento: `describe("Compra") > describe("cancelar") > it("pasa a REEMBOLSADA si estaba CONFIRMADA")`.

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
- En web las pantallas de abajo del stack y las tabs inactivas siguen montadas: acotar al contenedor (`cy.tid("lista-...")`) o filtrar `:visible`. Navegar por la UI (los flujos prueban lo que hace el usuario); desde la spec 16 una recarga o deep link en frío conserva la ruta.
- Un flujo de negocio por archivo; verificar resultado visible para el usuario, no detalles internos.
- Si un test falla de forma intermitente: esperar por contenido (`should`) en vez de `cy.wait(ms)`.
- Correr: `npm run e2e:servidores` en una terminal y `npm run e2e` en otra (anda en PowerShell y Git Bash).


## Antes de dar por terminado

Correr la suite completa del módulo, no solo el archivo nuevo, y mostrar la salida.

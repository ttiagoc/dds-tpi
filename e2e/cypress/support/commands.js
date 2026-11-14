const CONTRASENIA_DEMO = "Demo1234!";

const api = (ruta) => `${Cypress.expose("apiUrl")}${ruta}`;

Cypress.Commands.add("tid", (id) => cy.get(`[data-testid="${id}"]`));

Cypress.Commands.add("resetDatos", () => {
  cy.request("POST", api("/test/reset"));
});

Cypress.Commands.add("ingresar", (email) => {
  cy.visit("/");
  cy.tid("login-email").type(email);
  cy.tid("login-password").type(CONTRASENIA_DEMO, { log: false });
  cy.tid("login-ingresar").click();
  cy.tid("login-email").should("not.exist");
});

Cypress.Commands.add("irATab", (tab) => {
  cy.visit("/");
  cy.tid(`tab-${tab}`).click();
});

Cypress.Commands.add("salir", () => {
  cy.irATab("perfil");
  cy.tid("cerrar-sesion").click();
  cy.tid("login-email").should("be.visible");
});

const TARJETA_COMPRA = '[data-testid^="compra-"]';

Cypress.Commands.add("abrirMiCompra", (evento) => {
  cy.irATab("mis-compras");
  cy.tid("lista-compras").contains(TARJETA_COMPRA, evento).click();
});

Cypress.Commands.add("abrirCompraDelEvento", (evento, comprador) => {
  cy.irATab("mis-eventos");
  cy.tid("lista-mis-eventos").contains(evento).click();
  cy.tid("lista-compras-evento").contains(TARJETA_COMPRA, comprador).click();
});

Cypress.Commands.add("enviarMensajeComo", (email, compraId, mensaje) => {
  cy.request("POST", api("/auth/login"), { email, password: CONTRASENIA_DEMO }).then(({ body }) =>
    cy.request({
      method: "POST",
      url: api(`/compras/${compraId}/mensajes`),
      headers: { Authorization: `Bearer ${body.token}` },
      body: { mensaje },
    }),
  );
});

const EVENTO = "Festival Primavera Sonora";
const PREGUNTA = "¿Se puede entrar con mochila?";

const idDeCompraDeAna = (evento) =>
  cy
    .request("POST", `${Cypress.expose("apiUrl")}/auth/login`, {
      email: "ana@aiticket.com",
      password: "Demo1234!",
    })
    .then(({ body }) =>
      cy.request({
        url: `${Cypress.expose("apiUrl")}/compras?limit=50`,
        headers: { Authorization: `Bearer ${body.token}` },
      }),
    )
    .then(({ body }) => body.compras.find((compra) => compra.evento.nombre === evento).id);

describe("Mensajes sin leer", () => {
  beforeEach(() => {
    cy.resetDatos();
    cy.ingresar("fenix@aiticket.com");
  });

  it("Ana escribe, Fénix ve el número en la pestaña y desaparece al abrir el chat", () => {
    cy.tid("lista-mis-eventos").should("be.visible");
    cy.tid("tab-mensajes").invoke("text").should("not.match", /\d/);

    idDeCompraDeAna(EVENTO).then((compraId) => {
      cy.enviarMensajeComo("ana@aiticket.com", compraId, PREGUNTA);
      cy.tid("tab-mensajes").should("contain", "1");

      cy.tid("tab-mensajes").click();
      cy.tid(`conversacion-${compraId}`).should("contain", PREGUNTA).click();
      cy.tid("lista-mensajes").should("contain", PREGUNTA);
    });

    cy.go("back");
    cy.tid("tab-mensajes").invoke("text").should("not.match", /\d/);
  });
});

const EVENTO = "Festival Primavera Sonora";
const PREGUNTA = "¿Hasta qué hora se puede entrar?";
const RESPUESTA = "Hasta las 20 h, después cierra el ingreso.";

describe("Chat de la compra", () => {
  beforeEach(() => {
    cy.resetDatos();
    cy.ingresar("ana@aiticket.com");
  });

  it("Ana escribe, recibe la respuesta de Fénix en vivo y Fénix ve el mensaje", () => {
    cy.abrirMiCompra(EVENTO);
    cy.tid("compra-chat").click();

    cy.tid("chat-input").type(PREGUNTA);
    cy.tid("chat-enviar").click();
    cy.tid("lista-mensajes").should("contain", PREGUNTA);

    cy.location("pathname").then((ruta) => {
      const [, compraId] = ruta.match(/\/compras\/(\d+)\/chat/);
      cy.enviarMensajeComo("fenix@aiticket.com", compraId, RESPUESTA);
    });
    cy.tid("lista-mensajes").should("contain", RESPUESTA);

    cy.salir();
    cy.ingresar("fenix@aiticket.com");

    cy.abrirCompraDelEvento(EVENTO, "Ana");
    cy.tid("compra-chat").click();
    cy.tid("lista-mensajes").should("contain", PREGUNTA).and("contain", RESPUESTA);
  });
});

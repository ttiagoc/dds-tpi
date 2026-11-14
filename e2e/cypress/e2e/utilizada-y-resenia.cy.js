const EVENTO = "Festival Primavera Sonora";
const COMENTARIO = "Muy buena organización y excelente sonido.";

describe("Marcar utilizada y reseñar", () => {
  beforeEach(() => {
    cy.resetDatos();
    cy.ingresar("fenix@aiticket.com");
  });

  it("Fénix marca utilizada la compra de Ana y Ana la reseña", () => {
    cy.abrirCompraDelEvento(EVENTO, "Ana");
    cy.tid("compra-utilizada").click();
    cy.tid("confirmar-utilizada").click();
    cy.tid("compra-estado").should("contain", "Utilizada");

    cy.salir();
    cy.ingresar("ana@aiticket.com");

    cy.abrirMiCompra(EVENTO);
    cy.tid("compra-estado").should("contain", "Utilizada");
    cy.tid("compra-resenar").click();
    cy.tid("estrella-4").click();
    cy.tid("resenia-detalle").type(COMENTARIO);
    cy.tid("resenia-enviar").click();

    cy.tid("compra-resenia").should("contain", COMENTARIO);
  });
});

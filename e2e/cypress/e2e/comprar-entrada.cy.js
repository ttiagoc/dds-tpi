const EVENTO = "Maratón Nocturna";

describe("Comprar una entrada", () => {
  beforeEach(() => {
    cy.resetDatos();
    cy.ingresar("ana@aiticket.com");
  });

  it("busca un evento, compra 2 entradas y ve la compra pendiente en Mis compras", () => {
    cy.tid("buscador").type("Maratón");
    cy.tid("lista-eventos").contains(EVENTO).click();
    cy.tid("evento-comprar").click();
    cy.contains('[data-testid^="tipo-"]:visible', "Inscripción").click();
    cy.tid("cantidad-mas").click();
    cy.tid("cantidad-valor").should("have.text", "2");
    cy.tid("comprar-confirmar").click();

    cy.tid("compra-estado").should("contain", "Pendiente");
    cy.tid("compra-total").should("contain", "24.000");

    cy.abrirMiCompra(EVENTO);
    cy.tid("compra-estado").should("contain", "Pendiente");
  });
});

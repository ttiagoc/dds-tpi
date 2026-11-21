describe("Crear evento", () => {
  beforeEach(() => {
    cy.resetDatos();
    cy.ingresar("fenix@aiticket.com");
    cy.irATab("mis-eventos");
    cy.tid("fab-nuevo-evento").click();
  });

  it("al publicar vacío marca los campos y no sale de la pantalla", () => {
    cy.tid("evento-guardar").should("not.be.disabled").click();

    cy.tid("evento-nombre-error").should("contain", "entre 3 y 100 caracteres");
    cy.tid("evento-hora-error").should("contain", "Elegí la hora");
    cy.tid("evento-error").should("contain", "Revisá los");

    cy.tid("evento-nombre").type("Recital de prueba");
    cy.tid("evento-nombre-error").should("not.exist");
    cy.tid("evento-guardar").should("be.visible");
  });
});

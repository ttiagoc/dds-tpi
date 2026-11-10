Cypress.Commands.add("tid", (id) => cy.get(`[data-testid="${id}"]`));

Cypress.Commands.add("resetDatos", () => {
  cy.request("POST", `${Cypress.env("apiUrl")}/test/reset`);
});

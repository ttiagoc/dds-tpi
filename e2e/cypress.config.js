import { defineConfig } from "cypress";

export default defineConfig({
  expose: { apiUrl: "http://localhost:3000" },
  e2e: {
    baseUrl: "http://localhost:8081",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    viewportWidth: 375,
    viewportHeight: 812,
    video: false,
  },
});

# AGENTS.md — e2e

Tests end to end de AI Ticket It con Cypress sobre Expo Web. Las reglas generales están en `../AGENTS.md`.

## Estructura

```
cypress.config.js         config; valores públicos en la clave raíz `expose`
cypress/e2e/*.cy.js       un flujo de negocio por archivo
cypress/support/commands.js  comandos propios (cy.tid, cy.ingresar, cy.resetDatos…)
servidores.mjs            levanta back (NODE_ENV=test) + Expo Web
correr-cypress.mjs        runner de Cypress
```

## Reglas

- Cypress 16 quitó `Cypress.env()`: usar `Cypress.expose("apiUrl")`.
- Selectores solo por `testID` (`cy.tid`) o texto visible; nunca clases CSS.
- El back tiene que correr con `NODE_ENV=test` (habilita `POST /test/reset`) y el front con `EXPO_PUBLIC_API_URL=http://localhost:3000`.
- Si quedan puertos ocupados (8081, 3000) de una corrida anterior, liberarlos antes de volver a levantar.

## Comandos (desde la raíz)

```bash
npm run e2e:servidores   # terminal 1
npm run e2e              # terminal 2 (anda en PowerShell y Git Bash)
```

# ADR-006 — E2E con Cypress sobre Expo Web

- **Fecha:** 2026-11-10
- **Estado:** aceptada

## Contexto
Se quieren tests e2e con Cypress. Cypress solo corre en navegador; no puede manejar apps nativas.

## Opciones
1. **Cypress sobre Expo Web** (react-native-web) — mismo código, flujos reales front+back.
2. Cypress solo contra la API — no prueba el front.
3. Maestro (e2e nativo) — más fiel a mobile, otra herramienta.

## Decisión
Cypress contra `expo start --web` (:8081) con viewport mobile y back en `NODE_ENV=test`. Selectores por `testID` (→ `data-testid`).

## Consecuencias
- Toda pantalla tiene que funcionar en web: nada de APIs nativas sin fallback.
- No cubre diferencias específicas de Android/iOS → se prueban a mano en Expo Go.

## Rol de la IA
La IA detectó que Cypress no corre apps nativas y planteó alternativas; se eligió la opción web.

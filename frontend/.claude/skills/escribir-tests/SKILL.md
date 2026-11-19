---
name: escribir-tests
description: Usar al escribir o arreglar tests del front de AI Ticket It - pantallas, componentes y hooks con jest-expo + React Native Testing Library. Fija ubicación, nombres, mocks y qué cubrir.
---

# Escribir tests del front

Estrategia completa en `planes/05-testing.md`. Preferir TDD: test en rojo → implementación → verde.

## Nombres

Castellano, describen comportamiento: `describe("Compra") > describe("cancelar") > it("pasa a REEMBOLSADA si estaba CONFIRMADA")`.

## Frontend — RNTL

```js
import { screen, fireEvent, waitFor } from "@testing-library/react-native";
jest.mock("../../api/comprasApi");

it("muestra los días que faltan para una compra confirmada", async () => {
  obtenerMisCompras.mockResolvedValue({
    compras: [compraConfirmada],
    total: 1,
    page: 1,
    totalPages: 1,
  });
  renderConProviders(<MisCompras />, { usuario: ana });
  expect(await screen.findByText("Faltan 12 días")).toBeTruthy();
});
```

- Mock de la capa `src/api/*`, nunca de axios.
- Mínimo por pantalla: datos, error del back, acción principal.
- `expo-router`: `jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter())` (trae `navigate`, `dismissTo`, `setParams`, `useFocusEffect`). Navegación real entre rutas: `renderRouter` en `src/__tests__/navegacion.test.jsx`.
- Helpers en `src/test-utils/`: `renderConProviders` (usuarios `ANA`, `FENIX`), `fixtures.js` (`errorHttp`, `promesaManual`, compras, eventos, mensajes), `detalleCompra.jsx`.
- Mocks manuales en `frontend/__mocks__/`: `socket.io-client` (`ultimoSocket()`, `simular`, `respuestaAlUnirse`) y `react-native-paper-dates`.
- RNTL 14: `render` y `fireEvent` son async (`await`). `fireEvent.press` espera la promesa del handler: para probar el estado "enviando", envolver `() => { f(); }`.
- Snackbar: no hay `UNSAFE_getByType`; usar `jest.useFakeTimers()` para que se cierre.
- Pantallas con muchos inputs pasan el timeout de 5 s en paralelo: probar la lógica en el hook y dejar en la pantalla solo lo visible.

## Antes de dar por terminado

Correr la suite completa del módulo, no solo el archivo nuevo, y mostrar la salida.

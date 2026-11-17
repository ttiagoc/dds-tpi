---
name: escribir-tests
description: Usar al escribir o arreglar tests del backend de AI Ticket It - unitarios de dominio/services/controllers (Jest ESM) e integración HTTP (supertest). Fija ubicación, nombres, helpers y qué cubrir en cada nivel.
---

# Escribir tests del backend

Estrategia completa en `planes/05-testing.md`. Preferir TDD: test en rojo → implementación → verde.

## Nombres

Castellano, describen comportamiento: `describe("Compra") > describe("cancelar") > it("pasa a REEMBOLSADA si estaba CONFIRMADA")`.

## Backend — unit

```js
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { crearCompra, crearEvento } from "../helpers/domainFactories.js";

const AHORA = new Date("2026-11-15T12:00:00Z");

describe("Compra", () => {
  describe("cancelar", () => {
    it("rechaza cancelar una compra utilizada", () => {
      const compra = crearCompra({ estado: "UTILIZADA" });
      expect(() => compra.cancelar(compra.comprador.id, AHORA)).toThrow(UnprocessableEntityError);
    });
  });
});
```

- Dominio: sin mocks. Fechas fijas (`AHORA`), nunca `new Date()` sin argumentos.
- Services: repos fake con `jest.fn().mockResolvedValue(...)`, reloj `{ ahora: () => AHORA }`, notificador `{ mensajeNuevo: jest.fn() }`. Verificar: valor devuelto (forma `toResponse`), error tirado (`rejects.toThrow(ForbiddenError)`), que `save` se llamó o **no** se llamó.
- Controllers: `req` armado a mano, `res = crearRes()` (status/json/send devuelven `res`), `next = jest.fn()`; verificar status y `next(expect.any(BadRequestError))`.

## Backend — integración

```js
import request from "supertest";
const contenedor = crearContenedor({ reloj: { ahora: () => AHORA } });
await sembrar(contenedor, datosDePrueba);
const app = crearApp(contenedor);
const token = await loginComo(app, "ana@aiticket.com");

const res = await request(app).post("/compras").set("Authorization", `Bearer ${token}`)
  .send({ eventoId: 1, tipoEntradaId: 1, cantidad: 2 });
expect(res.status).toBe(201);
expect(res.body.estado).toBe("PENDIENTE");
```

- Contenedor nuevo por archivo/`beforeEach` → sin estado compartido entre tests.
- Por endpoint: feliz + los errores del contrato (400/401/403/404/409/422 que apliquen).


## Antes de dar por terminado

Correr la suite completa del módulo, no solo el archivo nuevo, y mostrar la salida.

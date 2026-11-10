import { describe, it, expect } from "@jest/globals";
import { crearReseniaValidation } from "../../src/validations/crearReseniaValidation.js";

const camposConError = (resultado) => resultado.error.issues.map((issue) => issue.path.join("."));
const body = (overrides = {}) => ({ puntuacion: 4, detalle: "Muy bueno", ...overrides });
const parsear = (datos) => crearReseniaValidation.safeParse(datos);

describe("crearReseniaValidation", () => {
  it("acepta un body válido y recorta los espacios del detalle", () => {
    expect(parsear(body({ detalle: "  Genial  " }))).toEqual({
      success: true,
      data: { puntuacion: 4, detalle: "Genial" },
    });
  });

  it("acepta puntuaciones de 1 a 5 y un detalle de 500 caracteres", () => {
    expect(parsear(body({ puntuacion: 1 })).success).toBe(true);
    expect(parsear(body({ puntuacion: 5, detalle: "a".repeat(500) })).success).toBe(true);
  });

  it.each([[0], [6], [3.5], ["4"], [null]])("rechaza la puntuación %p", (puntuacion) => {
    expect(camposConError(parsear(body({ puntuacion })))).toEqual(["puntuacion"]);
  });

  it.each([[""], ["   "], ["a".repeat(501)], [5]])("rechaza el detalle %p", (detalle) => {
    expect(camposConError(parsear(body({ detalle })))).toEqual(["detalle"]);
  });

  it("rechaza campos de más y campos faltantes", () => {
    expect(camposConError(parsear(body({ compraId: 7 })))).toEqual([""]);
    expect(camposConError(parsear({}))).toEqual(["puntuacion", "detalle"]);
  });
});

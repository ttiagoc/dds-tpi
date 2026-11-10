import { describe, it, expect } from "@jest/globals";
import { textoRequerido, esEnteroPositivo } from "../../src/domain/validaciones.js";
import { UnprocessableEntityError } from "../../src/errors/AppError.js";

describe("validaciones de dominio", () => {
  describe("textoRequerido", () => {
    it("devuelve el texto sin espacios en los bordes", () => {
      expect(textoRequerido("  Konex ", "msg")).toBe("Konex");
    });

    it.each(["", "   ", undefined, null, 3])("rechaza %p con el mensaje dado", (valor) => {
      expect(() => textoRequerido(valor, "Falta el lugar")).toThrow(UnprocessableEntityError);
      expect(() => textoRequerido(valor, "Falta el lugar")).toThrow("Falta el lugar");
    });
  });

  describe("esEnteroPositivo", () => {
    it.each([
      [1, true],
      [50, true],
      [0, false],
      [-1, false],
      [1.5, false],
      ["1", false],
      [undefined, false],
    ])("%p → %p", (valor, esperado) => {
      expect(esEnteroPositivo(valor)).toBe(esperado);
    });
  });
});

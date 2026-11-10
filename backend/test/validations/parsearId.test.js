import { describe, it, expect } from "@jest/globals";
import { parsearId } from "../../src/validations/parsearId.js";
import { BadRequestError } from "../../src/errors/AppError.js";

describe("parsearId", () => {
  it.each([
    ["7", 7],
    [7, 7],
  ])("convierte %p en %p", (valor, esperado) => {
    expect(parsearId(valor)).toBe(esperado);
  });

  it.each([["abc"], ["0"], [-1], [1.5], [undefined], [null], ["9007199254740993"]])(
    "rechaza %p con 400",
    (valor) => {
      expect(() => parsearId(valor)).toThrow(BadRequestError);
      expect(() => parsearId(valor)).toThrow("El id debe ser un entero positivo");
    },
  );
});

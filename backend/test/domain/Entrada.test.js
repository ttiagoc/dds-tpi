import { describe, it, expect } from "@jest/globals";
import { Entrada } from "../../src/domain/Entrada.js";
import { AHORA } from "../helpers/domainFactories.js";

describe("Entrada", () => {
  it("nace sin usar y se usa una sola vez", () => {
    const entrada = new Entrada({ numero: 1 });
    expect(entrada.estaUsada()).toBe(false);
    entrada.usar(AHORA);
    expect(entrada.fechaUso).toEqual(AHORA);
    expect(() => entrada.usar(AHORA)).toThrow("Esta entrada ya fue utilizada");
  });

  it("reconstruye la fecha de uso desde texto", () => {
    const entrada = new Entrada({ numero: 2, fechaUso: AHORA.toISOString() });
    expect(entrada.fechaUso).toEqual(AHORA);
  });

  it.each([0, -1, 1.5, "1"])("rechaza el número %p", (numero) => {
    expect(() => new Entrada({ numero })).toThrow(
      "El número de entrada tiene que ser un entero mayor a 0",
    );
  });

  it("paraCompra numera de 1 a la cantidad", () => {
    expect(Entrada.paraCompra(3).map((e) => e.numero)).toEqual([1, 2, 3]);
  });
});

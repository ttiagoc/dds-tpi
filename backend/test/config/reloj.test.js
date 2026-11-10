import { describe, it, expect } from "@jest/globals";
import { relojSistema } from "../../src/config/reloj.js";

describe("relojSistema", () => {
  it("devuelve la fecha actual", () => {
    const antes = Date.now();
    const ahora = relojSistema.ahora();
    expect(ahora).toBeInstanceOf(Date);
    expect(ahora.getTime()).toBeGreaterThanOrEqual(antes);
  });
});

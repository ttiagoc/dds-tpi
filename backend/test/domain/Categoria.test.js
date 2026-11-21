import { describe, it, expect } from "@jest/globals";
import { crearCategoria } from "../helpers/domainFactories.js";

describe("Categoria", () => {
  it("exige nombre", () => {
    expect(() => crearCategoria({ nombre: " " })).toThrow("La categoría necesita un nombre");
  });

  it.each([["conf"], ["CONFERENCIAS"], ["rencia"], [""]])(
    "coincide con %p sin distinguir mayúsculas",
    (texto) => {
      expect(crearCategoria({ nombre: "Conferencias" }).coincideCon(texto)).toBe(true);
    },
  );

  it("coincide sin acentos en ninguno de los dos lados", () => {
    expect(crearCategoria({ nombre: "Gastronomía" }).coincideCon("gastronomia")).toBe(true);
    expect(crearCategoria({ nombre: "Electronica" }).coincideCon("electrónica")).toBe(true);
  });

  it("no coincide con otro texto", () => {
    expect(crearCategoria({ nombre: "Teatro" }).coincideCon("cine")).toBe(false);
  });
});

import { describe, it, expect } from "@jest/globals";
import { TipoEntrada } from "../../src/domain/TipoEntrada.js";
import { UnprocessableEntityError } from "../../src/errors/AppError.js";
import { crearTipoEntrada } from "../helpers/domainFactories.js";

const datos = { nombre: "VIP", precio: 100, cupo: 10 };

describe("TipoEntrada", () => {
  describe("constructor", () => {
    it("crea un tipo con vendidas en 0 y descripción vacía", () => {
      expect(new TipoEntrada(datos)).toMatchObject({
        id: null,
        nombre: "VIP",
        descripcion: "",
        vendidas: 0,
      });
    });

    it("acepta precio 0", () => {
      expect(new TipoEntrada({ ...datos, precio: 0 }).precio).toBe(0);
    });

    it.each([
      [{ nombre: " " }, "El tipo de entrada necesita un nombre"],
      [{ precio: -1 }, "El precio no puede ser negativo"],
      [{ precio: "100" }, "El precio no es válido"],
      [{ precio: Infinity }, "El precio no es válido"],
      [{ precio: NaN }, "El precio no es válido"],
      [{ cupo: 0 }, "El cupo tiene que ser un entero mayor a 0"],
      [{ cupo: 1.5 }, "El cupo tiene que ser un entero mayor a 0"],
      [{ vendidas: 11 }, "Las entradas vendidas tienen que estar entre 0 y el cupo"],
      [{ vendidas: -1 }, "Las entradas vendidas tienen que estar entre 0 y el cupo"],
    ])("rechaza %p", (cambio, mensaje) => {
      expect(() => new TipoEntrada({ ...datos, ...cambio })).toThrow(UnprocessableEntityError);
      expect(() => new TipoEntrada({ ...datos, ...cambio })).toThrow(mensaje);
    });
  });

  describe("cupo", () => {
    it("calcula disponibles", () => {
      expect(crearTipoEntrada({ cupo: 10, vendidas: 8 }).disponibles()).toBe(2);
    });

    it("hay cupo para exactamente los disponibles y no para uno más", () => {
      const tipo = crearTipoEntrada({ cupo: 10, vendidas: 8 });
      expect(tipo.hayCupoPara(2)).toBe(true);
      expect(tipo.hayCupoPara(3)).toBe(false);
    });

    it.each([0, -1, 1.5, "1"])("no hay cupo para la cantidad %p", (cantidad) => {
      expect(crearTipoEntrada().hayCupoPara(cantidad)).toBe(false);
    });

    it("reservar suma vendidas", () => {
      const tipo = crearTipoEntrada({ cupo: 10, vendidas: 8 });
      tipo.reservar(2);
      expect(tipo.vendidas).toBe(10);
      expect(tipo.disponibles()).toBe(0);
    });

    it("reservar sin cupo falla y no cambia vendidas", () => {
      const tipo = crearTipoEntrada({ nombre: "VIP", cupo: 10, vendidas: 8 });
      expect(() => tipo.reservar(3)).toThrow("No hay cupo suficiente para VIP");
      expect(tipo.vendidas).toBe(8);
    });

    it("liberar resta vendidas sin bajar de 0", () => {
      const tipo = crearTipoEntrada({ vendidas: 3 });
      tipo.liberar(2);
      expect(tipo.vendidas).toBe(1);
      tipo.liberar(5);
      expect(tipo.vendidas).toBe(0);
    });

    it.each([0, -2, 1.5, undefined])("liberar rechaza la cantidad %p", (cantidad) => {
      const tipo = crearTipoEntrada({ vendidas: 3 });
      expect(() => tipo.liberar(cantidad)).toThrow(
        "La cantidad a liberar tiene que ser un entero mayor a 0",
      );
      expect(tipo.vendidas).toBe(3);
    });
  });
});

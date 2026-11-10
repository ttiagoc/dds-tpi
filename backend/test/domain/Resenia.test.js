import { describe, it, expect } from "@jest/globals";
import { Resenia } from "../../src/domain/Resenia.js";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";
import { UnprocessableEntityError } from "../../src/errors/AppError.js";
import { AHORA, crearCompra } from "../helpers/domainFactories.js";

const utilizada = () => crearCompra({ estado: EstadoCompra.UTILIZADA, id: 7 });

describe("Resenia", () => {
  describe("crear", () => {
    it("crea una reseña sobre una compra utilizada", () => {
      const compra = utilizada();
      const resenia = Resenia.crear({ compra, puntuacion: 5, detalle: " Excelente " }, AHORA);
      expect(resenia).toMatchObject({
        id: null,
        compraId: 7,
        puntuacion: 5,
        detalle: "Excelente",
        fecha: AHORA,
      });
      expect(resenia.comprador).toBe(compra.comprador);
      expect(resenia.evento).toBe(compra.evento);
    });

    it.each([
      EstadoCompra.PENDIENTE,
      EstadoCompra.CONFIRMADA,
      EstadoCompra.CANCELADA,
      EstadoCompra.REEMBOLSADA,
    ])("rechaza reseñar una compra %s", (estado) => {
      expect(() =>
        Resenia.crear({ compra: crearCompra({ estado }), puntuacion: 4, detalle: "Bien" }, AHORA),
      ).toThrow("Solo podés reseñar una compra utilizada");
    });

    it.each([0, 6, 3.5, "4"])("rechaza la puntuación %p", (puntuacion) => {
      expect(() =>
        Resenia.crear({ compra: utilizada(), puntuacion, detalle: "Bien" }, AHORA),
      ).toThrow("La puntuación tiene que ser un entero de 1 a 5");
    });

    it.each(["", "   ", "x".repeat(501), undefined])("rechaza el detalle %p", (detalle) => {
      expect(() => Resenia.crear({ compra: utilizada(), puntuacion: 3, detalle }, AHORA)).toThrow(
        UnprocessableEntityError,
      );
      expect(() => Resenia.crear({ compra: utilizada(), puntuacion: 3, detalle }, AHORA)).toThrow(
        "La reseña tiene que tener entre 1 y 500 caracteres",
      );
    });
  });

  describe("constructor (rehidratar)", () => {
    const base = () => {
      const compra = utilizada();
      return {
        comprador: compra.comprador,
        evento: compra.evento,
        compraId: 7,
        puntuacion: 4,
        detalle: "Bien",
        fecha: AHORA,
      };
    };

    it("acepta una reseña completa", () => {
      expect(new Resenia(base()).compraId).toBe(7);
    });

    it.each([
      [{ compraId: undefined }, "La reseña necesita una compra"],
      [{ comprador: undefined }, "La reseña necesita un comprador"],
      [{ evento: undefined }, "La reseña necesita un evento"],
      [{ fecha: "x" }, "La fecha de la reseña no es válida"],
    ])("rechaza %p", (cambio, mensaje) => {
      expect(() => new Resenia({ ...base(), ...cambio })).toThrow(mensaje);
    });
  });

  describe("promedio", () => {
    const conPuntuaciones = (...puntuaciones) => puntuaciones.map((puntuacion) => ({ puntuacion }));

    it("devuelve null si no hay reseñas", () => {
      expect(Resenia.promedio([])).toBeNull();
    });

    it("promedia con un decimal", () => {
      expect(Resenia.promedio(conPuntuaciones(5, 4))).toBe(4.5);
      expect(Resenia.promedio(conPuntuaciones(5, 4, 4))).toBe(4.3);
      expect(Resenia.promedio(conPuntuaciones(5, 5, 4))).toBe(4.7);
      expect(Resenia.promedio(conPuntuaciones(3))).toBe(3);
    });
  });
});

import { describe, it, expect } from "@jest/globals";
import { z } from "zod";
import { BaseController } from "../../src/controllers/BaseController.js";
import { BadRequestError } from "../../src/errors/AppError.js";
import { paginacionValidation } from "../../src/validations/paginacionValidation.js";

const controller = new BaseController();

describe("BaseController", () => {
  describe("parsearId", () => {
    it("convierte un string numérico en entero", () => {
      expect(controller.parsearId("7")).toBe(7);
    });

    it.each(["0", "-1", "abc", "1.5", "", undefined])("rechaza %p", (valor) => {
      expect(() => controller.parsearId(valor)).toThrow(BadRequestError);
      expect(() => controller.parsearId(valor)).toThrow("El id debe ser un entero positivo");
    });
  });

  describe("extraerYValidarQuery", () => {
    it("aplica los defaults de paginación", () => {
      expect(controller.extraerYValidarQuery({}, paginacionValidation)).toEqual({
        page: 1,
        limit: 20,
      });
    });

    it("convierte strings a números", () => {
      expect(
        controller.extraerYValidarQuery({ page: "2", limit: "50" }, paginacionValidation),
      ).toEqual({ page: 2, limit: 50 });
    });

    it.each([{ limit: "51" }, { limit: "0" }, { page: "0" }, { page: "x" }, { page: "1.5" }])(
      "rechaza %p con details",
      (query) => {
        let error;
        try {
          controller.extraerYValidarQuery(query, paginacionValidation);
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toBe("Parámetros de consulta inválidos");
        expect(error.details[0]).toEqual({
          campo: expect.any(String),
          mensaje: expect.any(String),
        });
      },
    );

    it("no modifica el objeto query original", () => {
      const query = { page: "3" };
      controller.extraerYValidarQuery(query, z.object({ page: z.coerce.number() }));
      expect(query).toEqual({ page: "3" });
    });
  });
});

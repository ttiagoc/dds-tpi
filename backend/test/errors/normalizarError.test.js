import { describe, it, expect } from "@jest/globals";
import { normalizarError } from "../../src/errors/normalizarError.js";
import { AppError, ConflictError } from "../../src/errors/AppError.js";

describe("normalizarError", () => {
  it("devuelve el mismo AppError", () => {
    const error = new ConflictError("Ya reseñaste esta compra");
    expect(normalizarError(error)).toBe(error);
  });

  it("convierte el JSON mal formado en 400", () => {
    const normalizado = normalizarError({ type: "entity.parse.failed", status: 400 });
    expect(normalizado.statusCode).toBe(400);
    expect(normalizado.message).toBe("El cuerpo de la solicitud no es un JSON válido");
  });

  it.each([new Error("boom"), { status: 413 }, null, "texto"])(
    "convierte %p en 500 genérico",
    (error) => {
      const normalizado = normalizarError(error);
      expect(normalizado).toBeInstanceOf(AppError);
      expect(normalizado.statusCode).toBe(500);
      expect(normalizado.message).toBe("Error interno del servidor");
    },
  );
});

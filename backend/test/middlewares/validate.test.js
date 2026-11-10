import { describe, it, expect, jest } from "@jest/globals";
import { z } from "zod";
import { validate } from "../../src/middlewares/validate.js";
import { BadRequestError } from "../../src/errors/AppError.js";

const schema = z
  .object({
    nombre: z.string().min(1),
    tipos: z.array(z.object({ precio: z.number().min(0) })).optional(),
  })
  .strict();

function validar(req) {
  const next = jest.fn();
  validate(schema)(req, {}, next);
  return { next, error: next.mock.calls[0][0] };
}

describe("validate", () => {
  it("reemplaza el body por el valor parseado y sigue", () => {
    const req = { body: { nombre: "Konex" } };
    const { next } = validar(req);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ nombre: "Konex" });
  });

  it("pasa un BadRequestError con campo y mensaje si falta un campo", () => {
    const { error } = validar({ body: {} });
    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.message).toBe("Datos inválidos");
    expect(error.details).toEqual([{ campo: "nombre", mensaje: expect.any(String) }]);
  });

  it("arma el campo con la ruta completa", () => {
    const { error } = validar({ body: { nombre: "x", tipos: [{ precio: -1 }] } });
    expect(error.details[0].campo).toBe("tipos.0.precio");
  });

  it("rechaza campos de más por ser strict", () => {
    expect(validar({ body: { nombre: "x", extra: 1 } }).error).toBeInstanceOf(BadRequestError);
  });

  it("trata un body ausente como objeto vacío", () => {
    expect(validar({}).error).toBeInstanceOf(BadRequestError);
  });
});

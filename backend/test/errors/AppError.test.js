import { describe, it, expect } from "@jest/globals";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
} from "../../src/errors/AppError.js";

describe("AppError", () => {
  it("marca como fail los errores 4xx", () => {
    const error = new AppError("Algo salió mal", 404);
    expect(error.status).toBe("fail");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Algo salió mal");
  });

  it("marca como error los 5xx", () => {
    expect(new AppError("Falla", 500).status).toBe("error");
  });

  it("guarda un timestamp ISO", () => {
    const error = new AppError("x", 400);
    expect(new Date(error.timestamp).toISOString()).toBe(error.timestamp);
  });

  it("deja details sin definir si no se pasan", () => {
    expect(new AppError("x", 400).details).toBeUndefined();
    expect(new AppError("x", 400, [{ campo: "a" }]).details).toEqual([{ campo: "a" }]);
  });

  it.each([
    [BadRequestError, 400],
    [UnauthorizedError, 401],
    [ForbiddenError, 403],
    [NotFoundError, 404],
    [ConflictError, 409],
    [UnprocessableEntityError, 422],
  ])("%p usa el código %i", (Clase, codigo) => {
    const error = new Clase("mensaje");
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(codigo);
    expect(error.status).toBe("fail");
    expect(error.name).toBe(Clase.name);
  });
});

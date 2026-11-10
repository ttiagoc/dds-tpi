import { describe, it, expect, jest } from "@jest/globals";
import { crearErrorLogger } from "../../src/middlewares/errorLogger.js";
import { NotFoundError } from "../../src/errors/AppError.js";

const req = { method: "GET", originalUrl: "/x" };
const crearConsola = () => ({ error: jest.fn(), warn: jest.fn() });

describe("errorLogger", () => {
  it("no loguea nada en test y pasa el error", () => {
    const consola = crearConsola();
    const next = jest.fn();
    const error = new Error("boom");
    crearErrorLogger({ nodeEnv: "test", consola })(error, req, {}, next);
    expect(consola.error).not.toHaveBeenCalled();
    expect(consola.warn).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("loguea los 5xx con stack", () => {
    const consola = crearConsola();
    const error = new Error("boom");
    crearErrorLogger({ nodeEnv: "development", consola })(error, req, {}, jest.fn());
    expect(consola.error).toHaveBeenCalledWith("500 GET /x - boom", error.stack);
  });

  it("loguea los 4xx en una línea", () => {
    const consola = crearConsola();
    const next = jest.fn();
    const error = new NotFoundError("No existe");
    crearErrorLogger({ nodeEnv: "development", consola })(error, req, {}, next);
    expect(consola.warn).toHaveBeenCalledWith("404 GET /x - No existe");
    expect(consola.error).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("usa el status del error de parseo de JSON como 4xx", () => {
    const consola = crearConsola();
    const error = Object.assign(new SyntaxError("bad"), { status: 400 });
    crearErrorLogger({ nodeEnv: "development", consola })(error, req, {}, jest.fn());
    expect(consola.warn).toHaveBeenCalledWith("400 GET /x - bad");
  });
});

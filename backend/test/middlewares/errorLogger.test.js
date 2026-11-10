import { describe, it, expect, jest } from "@jest/globals";
import { crearErrorLogger } from "../../src/middlewares/errorLogger.js";
import { NotFoundError } from "../../src/errors/AppError.js";

const req = { method: "GET", originalUrl: "/x" };

function loguear(error, nodeEnv = "development") {
  const consola = { error: jest.fn(), warn: jest.fn() };
  const next = jest.fn();
  crearErrorLogger({ nodeEnv, consola })(error, req, {}, next);
  return { consola, next };
}

describe("errorLogger", () => {
  it("no loguea nada en test y pasa el error", () => {
    const error = new Error("boom");
    const { consola, next } = loguear(error, "test");
    expect(consola.error).not.toHaveBeenCalled();
    expect(consola.warn).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("loguea los 5xx con el mensaje original y el stack", () => {
    const error = new Error("boom");
    const { consola } = loguear(error);
    expect(consola.error).toHaveBeenCalledWith("500 GET /x - boom", error.stack);
  });

  it("loguea los 4xx en una línea y pasa el error", () => {
    const error = new NotFoundError("No existe");
    const { consola, next } = loguear(error);
    expect(consola.warn).toHaveBeenCalledWith("404 GET /x - No existe");
    expect(consola.error).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("loguea el JSON mal formado con el mismo código que responde el handler", () => {
    const error = Object.assign(new SyntaxError("bad"), {
      type: "entity.parse.failed",
      status: 400,
    });
    const { consola } = loguear(error);
    expect(consola.warn).toHaveBeenCalledWith("400 GET /x - bad");
  });

  it("loguea como 500 un error con status propio no reconocido, igual que el handler", () => {
    const error = Object.assign(new Error("request entity too large"), { status: 413 });
    const { consola } = loguear(error);
    expect(consola.error).toHaveBeenCalledWith(
      "500 GET /x - request entity too large",
      error.stack,
    );
  });
});

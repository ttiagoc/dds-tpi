import { describe, it, expect, jest } from "@jest/globals";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import { UnprocessableEntityError, BadRequestError } from "../../src/errors/AppError.js";
import { crearRes } from "../helpers/http.js";

describe("errorHandler", () => {
  it("responde un AppError con su status y sin details si no tiene", () => {
    const res = crearRes();
    const error = new UnprocessableEntityError("No hay cupo suficiente para VIP");
    errorHandler(error, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      status: "fail",
      message: "No hay cupo suficiente para VIP",
      timestamp: error.timestamp,
    });
  });

  it("incluye details cuando existen", () => {
    const res = crearRes();
    const details = [{ campo: "a", mensaje: "b" }];
    errorHandler(new BadRequestError("Datos inválidos", details), {}, res, jest.fn());
    expect(res.json.mock.calls[0][0].details).toEqual(details);
  });

  it("responde 400 ante JSON mal formado", () => {
    const res = crearRes();
    const error = Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
      status: 400,
    });
    errorHandler(error, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0]).toEqual({
      status: "fail",
      message: "El cuerpo de la solicitud no es un JSON válido",
      timestamp: expect.any(String),
    });
  });

  it("responde 500 genérico ante un error inesperado, sin stack", () => {
    const res = crearRes();
    errorHandler(new Error("boom"), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0]).toEqual({
      status: "error",
      message: "Error interno del servidor",
      timestamp: expect.any(String),
    });
  });
});

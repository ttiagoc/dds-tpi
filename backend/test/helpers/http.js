import { describe, it, expect, jest } from "@jest/globals";
import { BadRequestError, NotFoundError } from "../../src/errors/AppError.js";

export function crearRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
}

export const usuarioComprador = { id: 3, rol: "COMPRADOR" };

export async function llamarController(Controller, metodo, req, servicio) {
  const res = crearRes();
  const next = jest.fn();
  await new Controller(servicio)[metodo](
    { usuario: usuarioComprador, params: {}, ...req },
    res,
    next,
  );
  return { res, next };
}

export function probarIdYErrores(Controller, casos) {
  describe.each(casos)(`${Controller.name}.%s`, (metodo, param) => {
    it("manda a next un 400 con un id inválido", async () => {
      const servicio = { [metodo]: jest.fn() };
      const req = { params: { [param]: "abc" } };
      const { next } = await llamarController(Controller, metodo, req, servicio);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(servicio[metodo]).not.toHaveBeenCalled();
    });

    it("pasa el error del service a next", async () => {
      const error = new NotFoundError("No existe");
      const servicio = { [metodo]: jest.fn().mockRejectedValue(error) };
      const req = { params: { [param]: "4" } };
      const { next } = await llamarController(Controller, metodo, req, servicio);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
}

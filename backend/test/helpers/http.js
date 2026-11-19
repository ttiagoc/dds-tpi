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

export async function responderCon(Controller, metodo, req, resultado, status = 200) {
  const servicio = { [metodo]: jest.fn().mockResolvedValue(resultado) };
  const { res } = await llamarController(Controller, metodo, req, servicio);
  expect(res.status).toHaveBeenCalledWith(status);
  expect(res.json).toHaveBeenCalledWith(resultado);
  return servicio[metodo];
}

async function esperarRechazoSinLlamar(Controller, metodo, req) {
  const servicio = { [metodo]: jest.fn() };
  const { next } = await llamarController(Controller, metodo, req, servicio);
  expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
  expect(servicio[metodo]).not.toHaveBeenCalled();
}

export function probarQueryInvalida(Controller, metodo, req) {
  it(`${metodo} manda a next un 400 con una query inválida`, () =>
    esperarRechazoSinLlamar(Controller, metodo, req));
}

export function probarIdYErrores(Controller, casos) {
  describe.each(casos)(`${Controller.name}.%s`, (metodo, param) => {
    it("manda a next un 400 con un id inválido", () =>
      esperarRechazoSinLlamar(Controller, metodo, { params: { [param]: "abc" } }));

    it("pasa el error del service a next", async () => {
      const error = new NotFoundError("No existe");
      const servicio = { [metodo]: jest.fn().mockRejectedValue(error) };
      const req = { params: { [param]: "4" } };
      const { next } = await llamarController(Controller, metodo, req, servicio);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
}

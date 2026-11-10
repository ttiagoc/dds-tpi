import { describe, it, expect, jest } from "@jest/globals";
import { autorizar, MENSAJE_SIN_PERMISO } from "../../src/middlewares/autorizar.js";
import { MENSAJE_SIN_SESION } from "../../src/middlewares/autenticar.js";
import { ForbiddenError, UnauthorizedError } from "../../src/errors/AppError.js";
import { Rol } from "../../src/domain/Rol.js";

function correr(roles, usuario) {
  const next = jest.fn();
  autorizar(...roles)({ usuario }, {}, next);
  return { next, error: next.mock.calls[0][0] };
}

describe("autorizar", () => {
  it("pasa 401 si no hay usuario", () => {
    const { error } = correr([Rol.ORGANIZADOR]);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.message).toBe(MENSAJE_SIN_SESION);
  });

  it("sigue si el rol está permitido", () => {
    const { next } = correr([Rol.ORGANIZADOR], { id: 1, rol: Rol.ORGANIZADOR });
    expect(next).toHaveBeenCalledWith();
  });

  it("pasa 403 si el rol no está permitido", () => {
    const { error } = correr([Rol.ORGANIZADOR], { id: 3, rol: Rol.COMPRADOR });
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.message).toBe("No tenés permiso para realizar esta acción");
    expect(MENSAJE_SIN_PERMISO).toBe(error.message);
  });

  it("acepta cualquiera de varios roles", () => {
    const { next } = correr([Rol.ORGANIZADOR, Rol.COMPRADOR], { id: 3, rol: Rol.COMPRADOR });
    expect(next).toHaveBeenCalledWith();
  });
});

import { describe, it, expect, jest } from "@jest/globals";
import {
  crearAutenticar,
  crearAutenticarOpcional,
  MENSAJE_SIN_SESION,
} from "../../src/middlewares/autenticar.js";
import { UnauthorizedError } from "../../src/errors/AppError.js";
import { crearComprador } from "../helpers/domainFactories.js";

const ana = crearComprador();
const fallo = new UnauthorizedError("Tu sesión expiró o no es válida. Iniciá sesión de nuevo");
const authService = {
  usuarioDesdeToken: jest.fn(async (token) => {
    if (token === "valido") return ana;
    throw fallo;
  }),
};

async function correr(crearMiddleware, authorization) {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  const next = jest.fn();
  await crearMiddleware(authService)(req, {}, next);
  return { req, next, error: next.mock.calls[0][0] };
}

describe("autenticar", () => {
  it("pasa 401 de sesión faltante sin header", async () => {
    const { error } = await correr(crearAutenticar);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.message).toBe("Necesitás iniciar sesión");
  });

  it("pasa 401 de sesión faltante sin el prefijo Bearer", async () => {
    const { error } = await correr(crearAutenticar, "Token valido");
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.message).toBe(MENSAJE_SIN_SESION);
  });

  it("pasa el error del service ante un token inválido", async () => {
    const { error, req } = await correr(crearAutenticar, "Bearer malo");
    expect(error).toBe(fallo);
    expect(req.usuario).toBeUndefined();
  });

  it("deja id y rol del repo en req.usuario con un token válido", async () => {
    const { next, req } = await correr(crearAutenticar, "Bearer valido");
    expect(next).toHaveBeenCalledWith();
    expect(req.usuario).toEqual({ id: ana.id, rol: "COMPRADOR" });
  });
});

describe("autenticarOpcional", () => {
  it.each([
    ["sin token", undefined],
    ["con un token inválido", "Bearer malo"],
    ["sin Bearer", "Token valido"],
  ])("sigue como anónimo %s", async (_caso, header) => {
    const { next, req } = await correr(crearAutenticarOpcional, header);
    expect(next).toHaveBeenCalledWith();
    expect(req.usuario).toBeUndefined();
  });

  it("pasa a next un error que no es de autenticación", async () => {
    const roto = new Error("se cayó el repo");
    const req = { headers: { authorization: "Bearer valido" } };
    const next = jest.fn();
    const servicioRoto = { usuarioDesdeToken: jest.fn().mockRejectedValue(roto) };
    await crearAutenticarOpcional(servicioRoto)(req, {}, next);
    expect(next).toHaveBeenCalledWith(roto);
    expect(req.usuario).toBeUndefined();
  });

  it("deja req.usuario con un token válido", async () => {
    const { req } = await correr(crearAutenticarOpcional, "Bearer valido");
    expect(req.usuario).toEqual({ id: ana.id, rol: "COMPRADOR" });
  });
});

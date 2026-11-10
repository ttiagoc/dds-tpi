import { describe, it, expect, jest } from "@jest/globals";
import { AuthController } from "../../src/controllers/AuthController.js";
import { UnauthorizedError } from "../../src/errors/AppError.js";
import { crearRes } from "../helpers/http.js";

const usuario = {
  id: 3,
  nombre: "Ana",
  apellido: "Pérez",
  email: "ana@aiticket.com",
  rol: "COMPRADOR",
};

describe("AuthController", () => {
  it("login responde 200 con token y usuario", async () => {
    const authService = { login: jest.fn().mockResolvedValue({ token: "t", usuario }) };
    const res = crearRes();
    const body = { email: "ana@aiticket.com", password: "x" };
    await new AuthController(authService).login({ body }, res, jest.fn());
    expect(authService.login).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: "t", usuario });
  });

  it("login pasa el error del service a next", async () => {
    const error = new UnauthorizedError("Email o contraseña incorrectos");
    const next = jest.fn();
    const authService = { login: jest.fn().mockRejectedValue(error) };
    await new AuthController(authService).login({ body: {} }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it("yo responde 200 con el perfil del usuario autenticado", async () => {
    const authService = { perfil: jest.fn().mockResolvedValue(usuario) };
    const res = crearRes();
    await new AuthController(authService).yo({ usuario: { id: 3 } }, res, jest.fn());
    expect(authService.perfil).toHaveBeenCalledWith(3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(usuario);
  });

  it("yo pasa el error del service a next", async () => {
    const error = new UnauthorizedError("x");
    const next = jest.fn();
    const authService = { perfil: jest.fn().mockRejectedValue(error) };
    await new AuthController(authService).yo({ usuario: { id: 3 } }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

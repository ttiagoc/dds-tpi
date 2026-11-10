import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { crearAppDePrueba, loginComo } from "../helpers/appDePrueba.js";
import { SECRET_DE_TEST } from "../../src/config/entorno.js";
import { crearAutenticar } from "../../src/middlewares/autenticar.js";
import { autorizar } from "../../src/middlewares/autorizar.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import { Rol } from "../../src/domain/Rol.js";

const SIN_SESION = "Necesitás iniciar sesión";
const SESION_INVALIDA = "Tu sesión expiró o no es válida. Iniciá sesión de nuevo";
const CREDENCIALES = "Email o contraseña incorrectos";

let app;
let contenedor;

beforeEach(async () => {
  ({ app, contenedor } = await crearAppDePrueba());
});

const login = (body) => request(app).post("/auth/login").send(body);
const yo = (authorization) => {
  const pedido = request(app).get("/auth/yo");
  return authorization ? pedido.set("Authorization", authorization) : pedido;
};

async function esperarSesionInvalida(token) {
  const res = await yo(`Bearer ${token}`);
  expect(res.status).toBe(401);
  expect(res.body.message).toBe(SESION_INVALIDA);
}

describe("POST /auth/login", () => {
  it("responde 200 con token y usuario sin passwordHash", async () => {
    const res = await login({ email: "ana@aiticket.com", password: "Demo1234!" });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.usuario).toEqual({
      id: expect.any(Number),
      nombre: "Ana",
      apellido: "Pérez",
      email: "ana@aiticket.com",
      rol: "COMPRADOR",
    });
  });

  it("acepta el email con mayúsculas", async () => {
    const res = await login({ email: "ANA@AITICKET.COM", password: "Demo1234!" });
    expect(res.status).toBe(200);
  });

  it.each([
    ["contraseña incorrecta", { email: "ana@aiticket.com", password: "otra" }],
    ["email inexistente", { email: "nadie@aiticket.com", password: "Demo1234!" }],
  ])("responde 401 con %s", async (_caso, body) => {
    const res = await login(body);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: "fail", message: CREDENCIALES });
  });

  it.each([
    ["email mal formado", { email: "ana" }],
    ["campos de más", { email: "ana@aiticket.com", password: "x", rol: "ORGANIZADOR" }],
  ])("responde 400 con %s", async (_caso, body) => {
    const res = await login(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Datos inválidos");
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it("devuelve los details en castellano", async () => {
    const res = await login({ email: "ana" });
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        { campo: "email", mensaje: "El email no es válido" },
        { campo: "password", mensaje: expect.stringMatching(/se esperaba texto/) },
      ]),
    );
  });
});

describe("GET /auth/yo", () => {
  it("responde 200 con el mismo usuario del login", async () => {
    const respuestaLogin = await login({ email: "fenix@aiticket.com", password: "Demo1234!" });
    const res = await yo(`Bearer ${respuestaLogin.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(respuestaLogin.body.usuario);
  });

  it.each([
    ["sin Authorization", undefined],
    ["con otro esquema", "Token abc"],
  ])("responde 401 %s", async (_caso, header) => {
    const res = await yo(header);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe(SIN_SESION);
  });

  it("responde 401 con un token vencido", async () => {
    const token = jwt.sign({ rol: "COMPRADOR" }, SECRET_DE_TEST, { subject: "1", expiresIn: -10 });
    await esperarSesionInvalida(token);
  });

  it("responde 401 con un token adulterado", async () => {
    const token = await loginComo(app, "ana@aiticket.com");
    const [header, , firma] = token.split(".");
    const payloadFalso = Buffer.from(JSON.stringify({ sub: "3", rol: "ORGANIZADOR" })).toString(
      "base64url",
    );
    await esperarSesionInvalida(`${header}.${payloadFalso}.${firma}`);
  });

  it("responde 401 con el token de un usuario borrado", async () => {
    const token = await loginComo(app, "ana@aiticket.com");
    await contenedor.repos.usuarioRepository.delete(Number(jwt.decode(token).sub));
    await esperarSesionInvalida(token);
  });
});

describe("autorizar detrás de autenticar", () => {
  it("responde 403 a un comprador en una ruta de organizador", async () => {
    const prueba = express();
    prueba.get(
      "/solo-organizadores",
      crearAutenticar(contenedor.servicios.authService),
      autorizar(Rol.ORGANIZADOR),
      (_req, res) => res.json({ ok: true }),
    );
    prueba.use(errorHandler);
    const token = await loginComo(app, "ana@aiticket.com");
    const res = await request(prueba)
      .get("/solo-organizadores")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("No tenés permiso para realizar esta acción");
  });
});

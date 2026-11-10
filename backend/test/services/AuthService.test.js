import { describe, it, expect, jest, beforeAll } from "@jest/globals";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  AuthService,
  MENSAJE_CREDENCIALES,
  MENSAJE_SESION_INVALIDA,
} from "../../src/services/AuthService.js";
import { UnauthorizedError } from "../../src/errors/AppError.js";
import { crearComprador } from "../helpers/domainFactories.js";

const SECRET = "secreto";
const PASSWORD = "Demo1234!";
let ana;

function crearRepo(usuario = ana) {
  return {
    findByEmail: jest.fn(async (email) =>
      usuario && email.toLowerCase() === usuario.email ? usuario : null,
    ),
    findById: jest.fn(async (id) => (usuario && id === usuario.id ? usuario : null)),
  };
}

function crearService(repo = crearRepo()) {
  return new AuthService({ usuarioRepository: repo, jwtSecret: SECRET, jwtExpiresIn: "8h" });
}

const firmar = (opciones = {}, secret = SECRET) =>
  jwt.sign({ rol: "COMPRADOR" }, secret, { subject: String(ana.id), expiresIn: "1h", ...opciones });

beforeAll(async () => {
  ana = crearComprador({ passwordHash: await bcrypt.hash(PASSWORD, 4) });
});

describe("AuthService", () => {
  describe("login", () => {
    it("devuelve un token con sub, rol y vencimiento, y el usuario sin passwordHash", async () => {
      const { token, usuario } = await crearService().login({
        email: ana.email,
        password: PASSWORD,
      });
      const payload = jwt.verify(token, SECRET);
      expect(payload.sub).toBe(String(ana.id));
      expect(payload.rol).toBe("COMPRADOR");
      expect(payload.exp - payload.iat).toBe(8 * 60 * 60);
      expect(jwt.decode(token, { complete: true }).header.alg).toBe("HS256");
      expect(usuario).toEqual({
        id: ana.id,
        nombre: "Ana",
        apellido: "Pérez",
        email: "ana@aiticket.com",
        rol: "COMPRADOR",
      });
    });

    it("acepta el email con mayúsculas", async () => {
      const resultado = await crearService().login({
        email: "ANA@AITICKET.COM",
        password: PASSWORD,
      });
      expect(resultado.usuario.id).toBe(ana.id);
    });

    it("rechaza una contraseña incorrecta", async () => {
      await expect(crearService().login({ email: ana.email, password: "otra" })).rejects.toThrow(
        new UnauthorizedError(MENSAJE_CREDENCIALES),
      );
    });

    it("rechaza un email inexistente con el mismo mensaje", async () => {
      const promesa = crearService().login({ email: "nadie@aiticket.com", password: PASSWORD });
      await expect(promesa).rejects.toBeInstanceOf(UnauthorizedError);
      await expect(promesa).rejects.toThrow(MENSAJE_CREDENCIALES);
    });

    it("compara la contraseña aunque el email no exista, para no revelarlo por el tiempo", async () => {
      const compare = jest.spyOn(bcrypt, "compare");
      await expect(
        crearService().login({ email: "nadie@aiticket.com", password: PASSWORD }),
      ).rejects.toThrow(MENSAJE_CREDENCIALES);
      expect(compare).toHaveBeenCalledWith(PASSWORD, expect.stringMatching(/^\$2[aby]\$10\$/));
      compare.mockRestore();
    });
  });

  describe("usuarioDesdeToken", () => {
    it("devuelve el usuario del repo para un token válido", async () => {
      const repo = crearRepo();
      expect(await crearService(repo).usuarioDesdeToken(firmar())).toBe(ana);
      expect(repo.findById).toHaveBeenCalledWith(ana.id);
    });

    it.each([
      ["vencido", () => firmar({ expiresIn: -10 })],
      ["firmado con otro secret", () => firmar({}, "otro")],
      ["firmado con otro algoritmo", () => firmar({ algorithm: "HS512" })],
      ["mal formado", () => "no-es-un-jwt"],
    ])("rechaza un token %s", async (_caso, token) => {
      const promesa = crearService().usuarioDesdeToken(token());
      await expect(promesa).rejects.toBeInstanceOf(UnauthorizedError);
      await expect(promesa).rejects.toThrow(MENSAJE_SESION_INVALIDA);
    });

    it("rechaza el token de un usuario que ya no existe", async () => {
      const service = crearService(crearRepo(null));
      await expect(service.usuarioDesdeToken(firmar())).rejects.toThrow(MENSAJE_SESION_INVALIDA);
    });
  });

  describe("perfil", () => {
    it("devuelve el usuario como respuesta", async () => {
      expect(await crearService().perfil(ana.id)).toMatchObject({ id: ana.id, rol: "COMPRADOR" });
    });

    it("rechaza un id inexistente", async () => {
      await expect(crearService().perfil(999)).rejects.toThrow(MENSAJE_SESION_INVALIDA);
    });
  });

  describe("toResponse", () => {
    it("nunca incluye passwordHash ni favoritos", () => {
      const respuesta = crearService().toResponse(ana);
      expect(Object.keys(respuesta).sort()).toEqual(["apellido", "email", "id", "nombre", "rol"]);
    });
  });
});

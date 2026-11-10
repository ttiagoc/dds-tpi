import { describe, it, expect } from "@jest/globals";
import { loginValidation } from "../../src/validations/loginValidation.js";
import { z } from "../../src/validations/zod.js";

describe("loginValidation", () => {
  it("acepta email y password", () => {
    const resultado = loginValidation.safeParse({ email: "ana@aiticket.com", password: "x" });
    expect(resultado.success).toBe(true);
  });

  it("rechaza un email mal formado con un mensaje en castellano", () => {
    const resultado = loginValidation.safeParse({ email: "ana", password: "x" });
    expect(resultado.success).toBe(false);
    expect(resultado.error.issues[0]).toMatchObject({
      path: ["email"],
      message: "El email no es válido",
    });
  });

  it("rechaza un password vacío", () => {
    const resultado = loginValidation.safeParse({ email: "ana@aiticket.com", password: "" });
    expect(resultado.error.issues[0]).toMatchObject({
      path: ["password"],
      message: "La contraseña es obligatoria",
    });
  });

  it("rechaza campos de más", () => {
    const resultado = loginValidation.safeParse({
      email: "ana@aiticket.com",
      password: "x",
      rol: "ORGANIZADOR",
    });
    expect(resultado.success).toBe(false);
  });
});

describe("zod con locale es", () => {
  it("da los mensajes por defecto en castellano", () => {
    const resultado = z.object({ nombre: z.string() }).safeParse({});
    expect(resultado.error.issues[0].message).toMatch(/se esperaba texto/);
  });
});

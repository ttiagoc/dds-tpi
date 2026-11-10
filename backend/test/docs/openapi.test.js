import { describe, it, expect } from "@jest/globals";
import { unir } from "../../src/docs/openapi/index.js";
import { conAuth, conAuthOpcional, ok } from "../../src/docs/openapi/comun.js";

const operacion = () => ({ summary: "Algo", responses: { 200: ok("Bien", { type: "object" }) } });

describe("unir", () => {
  it("junta los paths de todos los módulos", () => {
    const resultado = unir([{ paths: { "/a": {} } }, { paths: { "/b": {} } }, {}], "paths");
    expect(Object.keys(resultado)).toEqual(["/a", "/b"]);
  });

  it("falla si un path o schema está en dos módulos", () => {
    expect(() => unir([{ schemas: { Error: {} } }, { schemas: { Error: {} } }], "schemas")).toThrow(
      'Swagger: "Error" está definido en dos módulos',
    );
  });
});

describe("conAuth", () => {
  it("con rol agrega el token, el 401, el 403 y aclara quién puede usarlo", () => {
    const resultado = conAuth(operacion(), { rol: "COMPRADOR" });
    expect(resultado.security).toEqual([{ bearerAuth: [] }]);
    expect(Object.keys(resultado.responses)).toEqual(["200", "401", "403"]);
    expect(resultado.description).toMatch(/^\*\*Solo COMPRADOR\.\*\*/);
  });

  it("sin rol ni permiso sobre un recurso agrega el token y el 401, sin 403", () => {
    const resultado = conAuth(operacion());
    expect(resultado.security).toEqual([{ bearerAuth: [] }]);
    expect(Object.keys(resultado.responses)).toEqual(["200", "401"]);
    expect(resultado.description).toMatch(/^\*\*Requiere sesión\.\*\*/);
  });

  it("sin rol pero con permiso sobre el recurso agrega el 403", () => {
    const resultado = conAuth(operacion(), { conPermiso: true });
    expect(Object.keys(resultado.responses)).toEqual(["200", "401", "403"]);
  });

  it("conserva la descripción de la operación", () => {
    const resultado = conAuth({ ...operacion(), description: "Detalle." }, { rol: "ORGANIZADOR" });
    expect(resultado.description).toBe("**Solo ORGANIZADOR.** Detalle.");
  });
});

describe("conAuthOpcional", () => {
  it("permite llamar sin token o con token, sin agregar 401", () => {
    const resultado = conAuthOpcional(operacion());
    expect(resultado.security).toEqual([{}, { bearerAuth: [] }]);
    expect(Object.keys(resultado.responses)).toEqual(["200"]);
    expect(resultado.description).toMatch(/^\*\*Sesión opcional\.\*\*/);
  });
});

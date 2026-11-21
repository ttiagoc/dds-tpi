import { describe, it, expect } from "@jest/globals";
import { leerEntorno, SECRET_DE_TEST } from "../../src/config/entorno.js";

describe("leerEntorno", () => {
  it("falla si falta JWT_SECRET fuera de test", () => {
    expect(() => leerEntorno({ NODE_ENV: "development" })).toThrow(
      "Falta la variable de entorno JWT_SECRET",
    );
  });

  it("falla si NODE_ENV no está definido y falta JWT_SECRET", () => {
    expect(() => leerEntorno({})).toThrow("Falta la variable de entorno JWT_SECRET");
  });

  it("usa el secret fijo en test", () => {
    expect(leerEntorno({ NODE_ENV: "test" }).jwtSecret).toBe(SECRET_DE_TEST);
  });

  it("aplica valores por defecto", () => {
    expect(leerEntorno({ JWT_SECRET: "s" })).toEqual({
      port: 3000,
      jwtSecret: "s",
      jwtExpiresIn: "8h",
      georefUrl: "https://apis.datos.gob.ar/georef/api",
      nodeEnv: "development",
    });
  });

  it("respeta los valores definidos", () => {
    const entorno = leerEntorno({
      NODE_ENV: "production",
      PORT: "4000",
      JWT_SECRET: "otro",
      JWT_EXPIRES_IN: "1h",
      GEOREF_URL: "https://georef.test/api",
    });
    expect(entorno).toEqual({
      port: 4000,
      jwtSecret: "otro",
      jwtExpiresIn: "1h",
      georefUrl: "https://georef.test/api",
      nodeEnv: "production",
    });
  });
});

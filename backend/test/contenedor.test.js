import { describe, it, expect } from "@jest/globals";
import { crearContenedor } from "../src/contenedor.js";
import { relojSistema } from "../src/config/reloj.js";

describe("crearContenedor", () => {
  it("usa el reloj del sistema por defecto", () => {
    expect(crearContenedor().reloj).toBe(relojSistema);
  });

  it("respeta el reloj inyectado", () => {
    const reloj = { ahora: () => new Date("2026-11-15T12:00:00Z") };
    expect(crearContenedor({ reloj }).reloj).toBe(reloj);
  });

  it("expone repos, servicios y un resetear async", async () => {
    const contenedor = crearContenedor();
    expect(contenedor.repos).toEqual({});
    expect(contenedor.servicios).toEqual({});
    await expect(contenedor.resetear()).resolves.toBeUndefined();
  });

  it("cada llamada arma un contenedor independiente", () => {
    expect(crearContenedor().repos).not.toBe(crearContenedor().repos);
  });
});

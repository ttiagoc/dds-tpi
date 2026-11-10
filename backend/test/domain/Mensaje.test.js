import { describe, it, expect } from "@jest/globals";
import { Mensaje } from "../../src/domain/Mensaje.js";
import { Rol } from "../../src/domain/Rol.js";
import { AHORA } from "../helpers/domainFactories.js";

const usuario = { id: 3, nombre: "Ana Pérez", rol: Rol.COMPRADOR };

describe("Mensaje", () => {
  it("acepta la fecha como string ISO", () => {
    const mensaje = new Mensaje({ id: 1, usuario, mensaje: "Hola", enviado: AHORA.toISOString() });
    expect(mensaje.enviado).toEqual(AHORA);
  });

  it.each([undefined, "x"])("rechaza la fecha %p", (enviado) => {
    expect(() => new Mensaje({ id: 1, usuario, mensaje: "Hola", enviado })).toThrow(
      "La fecha del mensaje no es válida",
    );
  });
});

import { describe, it, expect } from "@jest/globals";
import { crearMensajeValidation } from "../../src/validations/crearMensajeValidation.js";

const camposConError = (resultado) => resultado.error.issues.map((issue) => issue.path.join("."));
const parsear = (datos) => crearMensajeValidation.safeParse(datos);

describe("crearMensajeValidation", () => {
  it("acepta un mensaje válido y recorta los espacios de los costados", () => {
    expect(parsear({ mensaje: "  ¿Hay guardarropas?  " })).toEqual({
      success: true,
      data: { mensaje: "¿Hay guardarropas?" },
    });
  });

  it("acepta mensajes de 1 y de 500 caracteres", () => {
    expect(parsear({ mensaje: "a" }).success).toBe(true);
    expect(parsear({ mensaje: "a".repeat(500) }).success).toBe(true);
  });

  it.each([[""], ["   "], ["a".repeat(501)], [5], [null]])("rechaza el mensaje %p", (mensaje) => {
    expect(camposConError(parsear({ mensaje }))).toEqual(["mensaje"]);
  });

  it("rechaza campos de más y el campo faltante", () => {
    expect(camposConError(parsear({ mensaje: "Hola", compraId: 7 }))).toEqual([""]);
    expect(camposConError(parsear({}))).toEqual(["mensaje"]);
  });
});

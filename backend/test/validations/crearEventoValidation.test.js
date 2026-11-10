import { describe, it, expect } from "@jest/globals";
import { crearEventoValidation } from "../../src/validations/crearEventoValidation.js";
import { bodyEvento, tipoEntradaBody } from "../helpers/domainFactories.js";

const tipo = tipoEntradaBody;
const body = bodyEvento;

function bodySin(campo) {
  const datos = body();
  delete datos[campo];
  return datos;
}

const parsear = (datos) => crearEventoValidation.safeParse(datos);
const camposConError = (resultado) => resultado.error.issues.map((issue) => issue.path.join("."));

describe("crearEventoValidation", () => {
  it("acepta un body válido sin modificarlo", () => {
    expect(parsear(body())).toEqual({ success: true, data: body() });
  });

  it("usa multimedia vacía por defecto", () => {
    expect(parsear(bodySin("multimedia")).data.multimedia).toEqual([]);
  });

  it("acepta una fecha con offset", () => {
    expect(parsear(body({ fecha: "2026-12-05T19:00:00-03:00" })).success).toBe(true);
  });

  it.each([["mañana"], ["2026-12-05"], ["2026-12-05T22:00:00"]])("rechaza la fecha %p", (fecha) => {
    expect(camposConError(parsear(body({ fecha })))).toEqual(["fecha"]);
  });

  it("rechaza URLs que no son http ni https", () => {
    expect(camposConError(parsear(body({ multimedia: ["ftp://img/1.jpg"] })))).toEqual([
      "multimedia.0",
    ]);
    expect(camposConError(parsear(body({ multimedia: ["no es una url"] })))).toEqual([
      "multimedia.0",
    ]);
  });

  it("acepta hasta 5 URLs y rechaza 6", () => {
    const urls = (n) => Array.from({ length: n }, (_v, i) => `http://img/${i}.jpg`);
    expect(parsear(body({ multimedia: urls(5) })).success).toBe(true);
    expect(camposConError(parsear(body({ multimedia: urls(6) })))).toEqual(["multimedia"]);
  });

  it("exige de 1 a 10 tipos de entrada", () => {
    const tipos = (n) => Array.from({ length: n }, (_v, i) => tipo({ nombre: `Tipo ${i}` }));
    expect(parsear(body({ tiposEntrada: tipos(10) })).success).toBe(true);
    expect(camposConError(parsear(body({ tiposEntrada: [] })))).toEqual(["tiposEntrada"]);
    expect(camposConError(parsear(body({ tiposEntrada: tipos(11) })))).toEqual(["tiposEntrada"]);
    expect(camposConError(parsear(bodySin("tiposEntrada")))).toEqual(["tiposEntrada"]);
  });

  it("limita la descripción del evento a 2000 caracteres y la del tipo a 200", () => {
    expect(parsear(body({ descripcion: "a".repeat(2000) })).success).toBe(true);
    expect(camposConError(parsear(body({ descripcion: "a".repeat(2001) })))).toEqual([
      "descripcion",
    ]);
    const largo = body({ tiposEntrada: [tipo({ descripcion: "a".repeat(201) })] });
    expect(camposConError(parsear(largo))).toEqual(["tiposEntrada.0.descripcion"]);
  });

  it("exige categoriaId entero positivo", () => {
    for (const categoriaId of [0, -1, 1.5, "6"]) {
      expect(camposConError(parsear(body({ categoriaId })))).toEqual(["categoriaId"]);
    }
  });

  it("exige precio numérico y cupo entero", () => {
    const resultado = parsear(body({ tiposEntrada: [tipo({ precio: "15000", cupo: 1.5 })] }));
    expect(camposConError(resultado)).toEqual(["tiposEntrada.0.precio", "tiposEntrada.0.cupo"]);
  });

  it("deja al dominio los rangos de precio, cupo, fecha y nombre", () => {
    const resultado = parsear(
      body({
        nombre: "ab",
        fecha: "2020-01-01T00:00:00.000Z",
        tiposEntrada: [tipo({ precio: -1, cupo: 0 }), tipo({ nombre: "general" })],
      }),
    );
    expect(resultado.success).toBe(true);
  });

  it("rechaza campos de más en el evento y en el tipo", () => {
    expect(camposConError(parsear(body({ organizadorId: 2 })))).toEqual([""]);
    const conVendidas = body({ tiposEntrada: [tipo({ vendidas: 3 })] });
    expect(camposConError(parsear(conVendidas))).toEqual(["tiposEntrada.0"]);
  });

  it("exige nombre, descripción y lugar como texto", () => {
    const resultado = parsear(body({ nombre: undefined, descripcion: 3, lugar: null }));
    expect(camposConError(resultado)).toEqual(["nombre", "descripcion", "lugar"]);
  });
});

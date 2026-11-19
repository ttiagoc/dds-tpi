import {
  formatearFecha,
  formatearFechaCorta,
  formatearPrecio,
  textoDiasRestantes,
  textoDisponibilidad,
} from "./formato";

const BUENOS_AIRES = "America/Argentina/Buenos_Aires";
const sinEspaciosRaros = (texto) => texto.replace(/\s/g, " ");

describe("formatearFecha", () => {
  it("muestra día abreviado, número, mes y hora en es-AR", () => {
    expect(formatearFecha("2026-12-20T23:00:00.000Z", { zonaHoraria: BUENOS_AIRES })).toBe(
      "dom 20 dic · 20:00",
    );
  });

  it("acepta un Date", () => {
    expect(formatearFecha(new Date("2026-11-27T12:05:00.000Z"), { zonaHoraria: "UTC" })).toBe(
      "vie 27 nov · 12:05",
    );
  });
});

describe("formatearPrecio", () => {
  it("formatea en pesos sin decimales", () => {
    expect(sinEspaciosRaros(formatearPrecio(45000))).toBe("$ 45.000");
    expect(sinEspaciosRaros(formatearPrecio(0))).toBe("$ 0");
  });
});

describe("formatearPuntaje", () => {
  const { formatearPuntaje } = require("./formato");

  it("usa coma decimal y un decimal como máximo", () => {
    expect(formatearPuntaje(4.5)).toBe("4,5");
    expect(formatearPuntaje(4)).toBe("4");
    expect(formatearPuntaje(3.333)).toBe("3,3");
  });
});

describe("formatearDia", () => {
  const { formatearDia } = require("./formato");

  it("muestra día, mes y año sin hora", () => {
    expect(formatearDia("2026-10-01T12:00:00.000Z", { zonaHoraria: "UTC" })).toBe("1 oct 2026");
  });
});

describe("textoDisponibilidad", () => {
  it.each([
    [0, "Agotado"],
    [1, "Quedan 1"],
    [40, "Quedan 40"],
  ])("con %i disponibles dice %s", (disponibles, texto) => {
    expect(textoDisponibilidad(disponibles)).toBe(texto);
  });
});

describe("textoDiasRestantes", () => {
  it.each([
    [0, "Es hoy"],
    [1, "Falta 1 día"],
    [12, "Faltan 12 días"],
    [null, null],
  ])("con %p dice %p", (dias, texto) => {
    expect(textoDiasRestantes(dias)).toBe(texto);
  });
});

describe("partesDelBloqueFecha", () => {
  const { partesDelBloqueFecha } = require("./formato");

  it("separa día de la semana, número, mes y hora para el bloque de fecha", () => {
    expect(partesDelBloqueFecha("2026-12-12T00:00:00.000Z", { zonaHoraria: BUENOS_AIRES })).toEqual(
      { diaSemana: "VIE", dia: "11", mes: "DIC", hora: "21:00" },
    );
  });

  it("no deja puntos de abreviatura", () => {
    const { diaSemana, mes } = partesDelBloqueFecha("2026-09-05T15:30:00.000Z", {
      zonaHoraria: "UTC",
    });
    expect(diaSemana).toBe("SÁB");
    expect(mes).toBe("SEP");
  });
});

describe("formatearMomento", () => {
  const { formatearMomento } = require("./formato");
  const ahora = new Date("2026-11-19T15:00:00.000Z");
  const momento = (fecha) => formatearMomento(fecha, { ahora, zonaHoraria: BUENOS_AIRES });

  it.each([
    ["2026-11-19T13:32:00.000Z", "10:32"],
    ["2026-11-18T23:00:00.000Z", "Ayer"],
    ["2026-11-16T15:00:00.000Z", "Lun"],
    ["2026-11-10T15:00:00.000Z", "10 nov"],
  ])("%s se muestra como %s", (fecha, esperado) => {
    expect(momento(fecha)).toBe(esperado);
  });
});

describe("etiquetaDeDia y claveDeDia", () => {
  const { etiquetaDeDia, claveDeDia } = require("./formato");
  const ahora = new Date("2026-11-19T15:00:00.000Z");
  const etiqueta = (fecha) => etiquetaDeDia(fecha, { ahora, zonaHoraria: BUENOS_AIRES });

  it.each([
    ["2026-11-19T13:32:00.000Z", "Hoy"],
    ["2026-11-18T23:00:00.000Z", "Ayer"],
    ["2026-11-10T15:00:00.000Z", "10 nov 2026"],
  ])("%s es %s", (fecha, esperado) => {
    expect(etiqueta(fecha)).toBe(esperado);
  });

  it("la clave es el día calendario en la zona horaria", () => {
    expect(claveDeDia("2026-11-19T02:00:00.000Z", { zonaHoraria: BUENOS_AIRES })).toBe(
      "2026-11-18",
    );
  });
});

describe("formatearFechaCorta", () => {
  it("muestra día/mes y hora de 24 h en la zona pedida", () => {
    expect(formatearFechaCorta("2026-11-13T01:05:00.000Z", { zonaHoraria: BUENOS_AIRES })).toBe(
      "12/11 22:05",
    );
  });

  it("completa con cero el día, el mes y la hora", () => {
    expect(formatearFechaCorta("2026-03-04T07:09:00.000Z", { zonaHoraria: "UTC" })).toBe(
      "04/03 07:09",
    );
  });
});

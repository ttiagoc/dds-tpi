import { formatearFecha, formatearPrecio } from "./formato";

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

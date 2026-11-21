import { mensaje } from "../../test-utils/fixtures";
import { conSeparadores, paraListaInvertida } from "./conSeparadores";

const ZONA = "America/Argentina/Buenos_Aires";
const ahora = new Date("2026-11-19T15:00:00.000Z");

describe("conSeparadores", () => {
  it("antepone un separador cada vez que cambia el día", () => {
    const mensajes = [
      mensaje({ id: 1, enviado: "2026-11-18T21:00:00.000Z" }),
      mensaje({ id: 2, enviado: "2026-11-18T22:00:00.000Z" }),
      mensaje({ id: 3, enviado: "2026-11-19T13:00:00.000Z" }),
    ];
    const items = conSeparadores(mensajes, { ahora, zonaHoraria: ZONA });
    expect(items.map((item) => item.dia?.etiqueta ?? item.mensaje.id)).toEqual([
      "Ayer",
      1,
      2,
      "Hoy",
      3,
    ]);
    expect(items[0].clave).toBe("dia-2026-11-18");
  });

  it("sin mensajes no hay separadores", () => {
    expect(conSeparadores([])).toEqual([]);
  });
});

describe("paraListaInvertida", () => {
  it("da vuelta el orden para que el separador quede arriba de los mensajes de su día", () => {
    const mensajes = [
      mensaje({ id: 1, enviado: "2026-11-18T21:00:00.000Z" }),
      mensaje({ id: 2, enviado: "2026-11-19T13:00:00.000Z" }),
    ];
    const claves = paraListaInvertida(mensajes, { ahora, zonaHoraria: ZONA }).map((i) => i.clave);
    expect(claves).toEqual(["mensaje-2", "dia-2026-11-19", "mensaje-1", "dia-2026-11-18"]);
  });
});

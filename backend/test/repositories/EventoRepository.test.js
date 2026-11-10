import { describe, it, expect, beforeEach } from "@jest/globals";
import { EventoRepository } from "../../src/repositories/EventoRepository.js";
import { AHORA, enDias, crearCategoria, crearEvento } from "../helpers/domainFactories.js";

let repo;
let piojos;
let hamlet;
let pasado;

const nombres = (eventos) => eventos.map((e) => e.nombre).sort();

beforeEach(async () => {
  repo = new EventoRepository();
  piojos = await repo.save(crearEvento({ id: null }));
  hamlet = await repo.save(
    crearEvento({
      id: null,
      nombre: "Hamlet",
      descripcion: "Clásico de Shakespeare",
      categoria: crearCategoria({ id: 2, nombre: "Teatro" }),
      tiposEntrada: [{ nombre: "Platea", precio: 30000, cupo: 10 }],
    }),
  );
  pasado = await repo.save(
    crearEvento({
      id: null,
      nombre: "Rock en el Parque",
      descripcion: "Rock nacional",
      fecha: enDias(-3),
      tiposEntrada: [{ nombre: "Campo", precio: 40000, cupo: 10 }],
    }),
  );
});

describe("EventoRepository.buscar", () => {
  it("sin filtros devuelve solo los eventos que no ocurrieron", async () => {
    expect(nombres(await repo.buscar({}, AHORA))).toEqual(nombres([piojos, hamlet]));
  });

  it("con incluirPasados también devuelve los pasados", async () => {
    expect(await repo.buscar({ incluirPasados: true }, AHORA)).toHaveLength(3);
  });

  it("excluye un evento que ocurre justo ahora", async () => {
    await repo.save(crearEvento({ id: null, nombre: "Ahora mismo", fecha: AHORA }));
    expect(nombres(await repo.buscar({}, AHORA))).not.toContain("Ahora mismo");
  });

  it("filtra por texto en nombre o descripción sin mayúsculas ni acentos", async () => {
    expect(await repo.buscar({ q: "PIOJOS" }, AHORA)).toEqual([piojos]);
    expect(await repo.buscar({ q: "clasico" }, AHORA)).toEqual([hamlet]);
  });

  it("filtra por categoría", async () => {
    expect(await repo.buscar({ categoria: 2 }, AHORA)).toEqual([hamlet]);
    expect(await repo.buscar({ categoria: 999 }, AHORA)).toEqual([]);
  });

  it("filtra por rango de precio con los bordes incluidos", async () => {
    expect(await repo.buscar({ precioMin: 30000, precioMax: 30000 }, AHORA)).toEqual([hamlet]);
    expect(nombres(await repo.buscar({ precioMin: 40000 }, AHORA))).toEqual([
      "Los Piojos en River",
    ]);
    expect(nombres(await repo.buscar({ precioMax: 45000 }, AHORA))).toEqual(
      nombres([piojos, hamlet]),
    );
  });

  it("combina los filtros con Y", async () => {
    const filtros = { q: "rock", categoria: 1, precioMax: 40000, incluirPasados: true };
    expect(await repo.buscar(filtros, AHORA)).toEqual([pasado]);
    expect(await repo.buscar({ ...filtros, incluirPasados: false }, AHORA)).toEqual([]);
  });
});

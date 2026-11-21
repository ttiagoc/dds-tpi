import { describe, it, expect, jest } from "@jest/globals";
import {
  GeorefGeocodificador,
  GeocodificadorNoDisponible,
  consultas,
} from "../../../src/services/geocodificacion/GeorefGeocodificador.js";

const URL_BASE = "https://georef.test/api";

const respuesta = (direcciones, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => ({ direcciones }),
});

const conUbicacion = (lat, lon) => ({ nomenclatura: "X", ubicacion: { lat, lon } });

const parametrosDe = (fetch, llamada) =>
  Object.fromEntries(new URL(fetch.mock.calls[llamada][0]).searchParams);

describe("consultas", () => {
  it("con dos partes prueba la segunda como provincia, localidad y departamento", () => {
    expect(consultas("Calle Corrientes 1234, CABA")).toEqual([
      { direccion: "Corrientes 1234", provincia: "CABA" },
      { direccion: "Corrientes 1234", localidad: "CABA" },
      { direccion: "Corrientes 1234", departamento: "CABA" },
    ]);
  });

  it("con tres o más partes usa la última como provincia y la anterior como localidad o departamento", () => {
    expect(consultas("Sarmiento 3131, Balvanera, CABA, Buenos Aires")).toEqual([
      { direccion: "Sarmiento 3131", provincia: "Buenos Aires", localidad: "CABA" },
      { direccion: "Sarmiento 3131", provincia: "Buenos Aires", departamento: "CABA" },
      { direccion: "Sarmiento 3131", provincia: "Buenos Aires" },
    ]);
  });
});

describe("GeorefGeocodificador.ubicar", () => {
  const crear = (fetch) => new GeorefGeocodificador({ url: URL_BASE, fetch });

  it("devuelve la ubicación de la primera consulta que encuentra algo", async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(respuesta([]))
      .mockResolvedValueOnce(
        respuesta([{ nomenclatura: "sin ubicación" }, conUbicacion(-34.6, -58.4)]),
      );
    const ubicacion = await crear(fetch).ubicar("Sarmiento 3131, CABA, Buenos Aires");
    expect(ubicacion).toEqual({ latitud: -34.6, longitud: -58.4 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0][0]).toMatch(/^https:\/\/georef\.test\/api\/direcciones\?/);
    expect(parametrosDe(fetch, 1)).toEqual({
      direccion: "Sarmiento 3131",
      provincia: "Buenos Aires",
      departamento: "CABA",
      max: "5",
    });
  });

  it("si ninguna consulta encuentra la dirección devuelve null", async () => {
    const fetch = jest.fn().mockResolvedValue(respuesta([]));
    expect(await crear(fetch).ubicar("Inventada 1, Nada, Ningunlado")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("un 4xx de Georef cuenta como sin resultados y sigue con la próxima", async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(respuesta(null, 400))
      .mockResolvedValueOnce(respuesta([conUbicacion(-1, -2)]));
    expect(await crear(fetch).ubicar("Calle 1, CABA")).toEqual({ latitud: -1, longitud: -2 });
  });

  it("un 5xx o un error de red lo informa como no disponible", async () => {
    await expect(
      crear(jest.fn().mockResolvedValue(respuesta(null, 503))).ubicar("Calle 1, CABA"),
    ).rejects.toBeInstanceOf(GeocodificadorNoDisponible);
    await expect(
      crear(jest.fn().mockRejectedValue(new Error("timeout"))).ubicar("Calle 1, CABA"),
    ).rejects.toBeInstanceOf(GeocodificadorNoDisponible);
  });

  it("corta cada consulta con un timeout", async () => {
    const fetch = jest.fn().mockResolvedValue(respuesta([conUbicacion(1, 2)]));
    await crear(fetch).ubicar("Calle 1, CABA");
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});

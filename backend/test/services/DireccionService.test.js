import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { DireccionService } from "../../src/services/DireccionService.js";
import { GeocodificadorNoDisponible } from "../../src/services/geocodificacion/GeorefGeocodificador.js";
import { UBICACION_DE_PRUEBA } from "../helpers/domainFactories.js";

const CAMPOS = {
  calle: "Sarmiento",
  numero: 3131,
  localidad: "Balvanera",
  provincia: "Ciudad Autónoma de Buenos Aires",
};
const DIRECCION = "Sarmiento 3131, Balvanera, Ciudad Autónoma de Buenos Aires";

let geocodificador;
let service;

beforeEach(() => {
  geocodificador = { ubicar: jest.fn(async () => UBICACION_DE_PRUEBA) };
  service = new DireccionService({ geocodificador });
});

describe("DireccionService.ubicar", () => {
  it("arma la dirección con los campos y devuelve dónde queda", async () => {
    expect(await service.ubicar(CAMPOS)).toEqual({ direccion: DIRECCION, ...UBICACION_DE_PRUEBA });
    expect(geocodificador.ubicar).toHaveBeenCalledWith(DIRECCION);
  });

  it("si no la encuentra responde 422 en el campo dirección", async () => {
    geocodificador.ubicar.mockResolvedValue(null);
    await expect(service.ubicar(CAMPOS)).rejects.toMatchObject({
      statusCode: 422,
      message: "No encontramos esa dirección",
      details: [{ campo: "direccion", mensaje: "No encontramos esa dirección" }],
    });
  });

  it("si Georef no responde devuelve 503", async () => {
    geocodificador.ubicar.mockRejectedValue(new GeocodificadorNoDisponible("timeout"));
    await expect(service.ubicar(CAMPOS)).rejects.toMatchObject({
      statusCode: 503,
      message: "No pudimos consultar el mapa, probá en un rato",
    });
  });
});

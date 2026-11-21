import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { ANA, FENIX, conToken, crearAppDePrueba, loginComo } from "../helpers/appDePrueba.js";
import { UBICACION_DE_PRUEBA, geocodificadorFijo } from "../helpers/domainFactories.js";
import { GeocodificadorNoDisponible } from "../../src/services/geocodificacion/GeorefGeocodificador.js";

const QUERY = {
  calle: "Sarmiento",
  numero: "3131",
  localidad: "Balvanera",
  provincia: "Ciudad Autónoma de Buenos Aires",
};

async function ubicar({ geocodificador, email = FENIX, query = QUERY } = {}) {
  const { app } = await crearAppDePrueba({ geocodificador });
  const token = email && (await loginComo(app, email));
  return conToken(request(app).get("/direcciones/ubicacion").query(query), token);
}

describe("GET /direcciones/ubicacion", () => {
  it("devuelve la dirección armada y sus coordenadas", async () => {
    const res = await ubicar();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      direccion: "Sarmiento 3131, Balvanera, Ciudad Autónoma de Buenos Aires",
      ...UBICACION_DE_PRUEBA,
    });
  });

  it("si no encuentra la dirección responde 422", async () => {
    const res = await ubicar({ geocodificador: geocodificadorFijo(null) });
    expect(res.status).toBe(422);
    expect(res.body.message).toBe("No encontramos esa dirección");
  });

  it("si Georef no responde responde 503", async () => {
    const caido = {
      ubicar: async () => {
        throw new GeocodificadorNoDisponible("timeout");
      },
    };
    const res = await ubicar({ geocodificador: caido });
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      status: "error",
      message: "No pudimos consultar el mapa, probá en un rato",
    });
  });

  it("con una query inválida responde 400", async () => {
    const res = await ubicar({ query: { ...QUERY, numero: "abc" } });
    expect(res.status).toBe(400);
  });

  it.each([
    ["sin token", null, 401],
    ["con el token de Ana", ANA, 403],
  ])("%s responde %i", async (_caso, email, status) => {
    expect((await ubicar({ email })).status).toBe(status);
  });
});

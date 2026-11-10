import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { crearAppDePrueba, pedirComo, eventoDelSeed, ANA, FENIX } from "../helpers/appDePrueba.js";
import { MENSAJE_SIN_PERMISO } from "../../src/errors/mensajes.js";

const HAMLET = "Hamlet";
const ELECTRO = "Fiesta Electrónica al Aire Libre";
const PIOJOS = "Los Piojos en River";
const ROCK = "Rock en el Parque";

let app;
let contenedor;

beforeEach(async () => {
  ({ app, contenedor } = await crearAppDePrueba());
});

const listar = (email = ANA) => pedirComo(app, request(app).get("/usuarios/yo/favoritos"), email);
const agregar = (id, email = ANA) =>
  pedirComo(app, request(app).put(`/usuarios/yo/favoritos/${id}`), email);
const quitar = (id, email = ANA) =>
  pedirComo(app, request(app).delete(`/usuarios/yo/favoritos/${id}`), email);
const idDeEvento = async (nombre) => (await eventoDelSeed(contenedor, nombre)).id;
const nombres = (res) => res.body.map((e) => e.nombre);

describe("favoritos de Ana", () => {
  it("lista Hamlet y la Fiesta Electrónica por fecha, con esFavorito true", async () => {
    const res = await listar();
    expect(res.status).toBe(200);
    expect(nombres(res)).toEqual([HAMLET, ELECTRO]);
    expect(res.body.every((e) => e.esFavorito)).toBe(true);
    expect(res.body[0].organizador).toHaveProperty("puntajePromedio");
  });

  it("agregar Los Piojos dos veces responde 204 y queda primero una sola vez", async () => {
    const id = await idDeEvento(PIOJOS);
    const primera = await agregar(id);
    expect(primera.status).toBe(204);
    expect(primera.body).toEqual({});
    expect((await agregar(id)).status).toBe(204);
    expect(nombres(await listar())).toEqual([PIOJOS, HAMLET, ELECTRO]);
  });

  it("admite un evento que ya ocurrió y lo lista primero", async () => {
    expect((await agregar(await idDeEvento(ROCK))).status).toBe(204);
    expect(nombres(await listar())).toEqual([ROCK, HAMLET, ELECTRO]);
  });

  it("quitar Hamlet dos veces responde 204 y deja de ser favorito en el detalle", async () => {
    const id = await idDeEvento(HAMLET);
    expect((await quitar(id)).status).toBe(204);
    expect((await quitar(id)).status).toBe(204);
    expect(nombres(await listar())).toEqual([ELECTRO]);
    const detalle = await pedirComo(app, request(app).get(`/eventos/${id}`), ANA);
    expect(detalle.body.esFavorito).toBe(false);
  });

  it("quitar un evento inexistente responde 204", async () => {
    expect((await quitar(999)).status).toBe(204);
  });
});

describe("errores de favoritos", () => {
  it("agregar un evento inexistente responde 404", async () => {
    const res = await agregar(999);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No existe el evento");
  });

  it("agregar o quitar con un id inválido responde 400", async () => {
    expect((await agregar("abc")).status).toBe(400);
    expect((await quitar("abc")).status).toBe(400);
  });

  it.each([
    ["Fénix (organizador)", FENIX, 403],
    ["sin token", null, 401],
  ])("%s responde %i en los tres endpoints", async (_caso, email, status) => {
    const id = await idDeEvento(PIOJOS);
    for (const res of [await listar(email), await agregar(id, email), await quitar(id, email)]) {
      expect(res.status).toBe(status);
      if (status === 403) expect(res.body.message).toBe(MENSAJE_SIN_PERMISO);
    }
  });
});

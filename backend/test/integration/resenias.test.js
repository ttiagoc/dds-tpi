import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import {
  crearAppDePrueba,
  pedirComo,
  idDeCompraDelSeed,
  ANA,
  BRUNO,
  FENIX,
  KONEX,
} from "../helpers/appDePrueba.js";
import { MENSAJE_SIN_PERMISO } from "../../src/errors/mensajes.js";

const IMPRO = "Impro Total";
const BODY = { puntuacion: 5, detalle: "Genial" };

let app;
let contenedor;

beforeEach(async () => {
  ({ app, contenedor } = await crearAppDePrueba());
});

const reseniar = (id, body = BODY, email = ANA) =>
  pedirComo(app, request(app).post(`/compras/${id}/resenia`).send(body), email);
const reseniasDe = (id, query = {}) =>
  request(app).get(`/organizadores/${id}/resenias`).query(query);
const idDeCompra = (nombreEvento, email = ANA) =>
  idDeCompraDelSeed(contenedor, email, nombreEvento);
const idDeUsuario = async (email) =>
  (await contenedor.repos.usuarioRepository.findOneWhere((u) => u.email === email)).id;

describe("POST /compras/:id/resenia", () => {
  it("Ana reseña su compra utilizada de Impro Total y suma al puntaje de Konex", async () => {
    const id = await idDeCompra(IMPRO);
    const res = await reseniar(id);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      compraId: id,
      puntuacion: 5,
      detalle: "Genial",
      evento: { nombre: IMPRO },
      comprador: { nombre: "Ana Pérez" },
    });
    const compra = await pedirComo(app, request(app).get(`/compras/${id}`), ANA);
    expect(compra.body.resenia).toEqual({ puntuacion: 5, detalle: "Genial" });
    expect(compra.body.acciones.puedeReseniar).toBe(false);
    const konex = await reseniasDe(await idDeUsuario(KONEX));
    expect(konex.body.organizador).toMatchObject({ puntajePromedio: 4, cantidadResenias: 3 });
  });

  it("una compra ya reseñada responde 409", async () => {
    const res = await reseniar(await idDeCompra("Rock en el Parque"));
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Ya reseñaste esta compra");
  });

  it("una compra que no está utilizada responde 422", async () => {
    const res = await reseniar(await idDeCompra("Festival Primavera Sonora"));
    expect(res.status).toBe(422);
    expect(res.body.message).toBe("Solo podés reseñar una compra utilizada");
  });

  it.each([
    ["Bruno con la compra de Ana", BRUNO, 403],
    ["Fénix (organizador)", FENIX, 403],
    ["sin token", null, 401],
  ])("%s responde %i", async (_caso, email, status) => {
    const res = await reseniar(await idDeCompra(IMPRO), BODY, email);
    expect(res.status).toBe(status);
    if (status === 403) expect(res.body.message).toBe(MENSAJE_SIN_PERMISO);
  });

  it("una compra inexistente responde 404 y un id inválido 400", async () => {
    const inexistente = await reseniar(999);
    expect(inexistente.status).toBe(404);
    expect(inexistente.body.message).toBe("No existe la compra");
    expect((await reseniar("abc")).status).toBe(400);
  });

  it.each([
    ["puntuación 0", { ...BODY, puntuacion: 0 }],
    ["puntuación 6", { ...BODY, puntuacion: 6 }],
    ["puntuación 3.5", { ...BODY, puntuacion: 3.5 }],
    ["sin detalle", { puntuacion: 4 }],
    ["detalle de 501 caracteres", { ...BODY, detalle: "a".repeat(501) }],
    ["un campo de más", { ...BODY, fecha: "2026-11-15" }],
  ])("con %s responde 400", async (_caso, body) => {
    expect((await reseniar(await idDeCompra(IMPRO), body)).status).toBe(400);
  });
});

describe("GET /organizadores/:id/resenias", () => {
  it("sin sesión trae el puntaje de Fénix y sus reseñas de la más nueva a la más vieja", async () => {
    const id = await idDeUsuario(FENIX);
    const res = await reseniasDe(id);
    expect(res.status).toBe(200);
    expect(res.body.organizador).toEqual({
      id,
      nombre: "Fénix Producciones",
      puntajePromedio: 4.5,
      cantidadResenias: 2,
    });
    expect(res.body).toMatchObject({ total: 2, page: 1, totalPages: 1 });
    expect(res.body.resenias.every((r) => r.evento.nombre === "Rock en el Parque")).toBe(true);
    const [primera, segunda] = res.body.resenias.map((r) => r.fecha);
    expect(primera >= segunda).toBe(true);
  });

  it("con limit=1 trae una reseña y el total de páginas", async () => {
    const res = await reseniasDe(await idDeUsuario(FENIX), { limit: 1 });
    expect(res.body.resenias).toHaveLength(1);
    expect(res.body).toMatchObject({ total: 2, totalPages: 2 });
  });

  it("el id de una compradora o uno inexistente responde 404", async () => {
    for (const id of [await idDeUsuario(ANA), 999]) {
      const res = await reseniasDe(id);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("No existe el organizador");
    }
  });

  it("un id inválido o limit=51 responde 400", async () => {
    expect((await reseniasDe("abc")).status).toBe(400);
    expect((await reseniasDe(await idDeUsuario(FENIX), { limit: 51 })).status).toBe(400);
  });
});

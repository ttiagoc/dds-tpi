import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import {
  crearAppDePrueba,
  pedirComo,
  eventoDelSeed,
  idDeCompraDelSeed,
  ANA,
  BRUNO,
  FENIX,
  KONEX,
} from "../helpers/appDePrueba.js";
import { MENSAJE_SIN_PERMISO } from "../../src/errors/mensajes.js";

const PRIMAVERA = "Festival Primavera Sonora";

let app;
let contenedor;

beforeEach(async () => {
  ({ app, contenedor } = await crearAppDePrueba());
});

const marcarUtilizada = (id, email = FENIX) =>
  pedirComo(app, request(app).post(`/compras/${id}/uso`), email);
const comprasDelEvento = (id, query = {}, email = FENIX) =>
  pedirComo(app, request(app).get(`/eventos/${id}/compras`).query(query), email);
const idDeCompra = (email, nombreEvento) => idDeCompraDelSeed(contenedor, email, nombreEvento);
const idDeEvento = async (nombre) => (await eventoDelSeed(contenedor, nombre)).id;

describe("POST /compras/:id/uso", () => {
  it("Fénix marca utilizada la compra CONFIRMADA de Ana y ella ya puede reseñarla", async () => {
    const id = await idDeCompra(ANA, PRIMAVERA);
    const res = await marcarUtilizada(id);
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("UTILIZADA");
    expect(res.body.historial.at(-1)).toMatchObject({
      estado: "UTILIZADA",
      quien: { nombre: "Fénix Producciones" },
    });
    const deAna = await pedirComo(app, request(app).get(`/compras/${id}`), ANA);
    expect(deAna.body.acciones.puedeReseniar).toBe(true);
  });

  it("la compra PENDIENTE de Ana a Los Piojos responde 422", async () => {
    const res = await marcarUtilizada(await idDeCompra(ANA, "Los Piojos en River"));
    expect(res.status).toBe(422);
    expect(res.body.message).toBe("No se puede pasar de PENDIENTE a UTILIZADA");
  });

  it("una compra inexistente responde 404 y un id inválido 400", async () => {
    const inexistente = await marcarUtilizada(999);
    expect(inexistente.status).toBe(404);
    expect(inexistente.body.message).toBe("No existe la compra");
    expect((await marcarUtilizada("abc")).status).toBe(400);
  });
});

const validarEntrada = (id, numero, email = FENIX) =>
  pedirComo(app, request(app).post(`/compras/${id}/entradas/${numero}/uso`), email);

describe("POST /compras/:id/entradas/:numero/uso", () => {
  it("Fénix valida las dos entradas de Ana por separado", async () => {
    const id = await idDeCompra(ANA, PRIMAVERA);
    const primera = await validarEntrada(id, 1);
    expect(primera.status).toBe(200);
    expect(primera.body.estado).toBe("UTILIZADA");
    expect(primera.body.entradas.map((e) => e.puedeValidarse)).toEqual([false, true]);
    const segunda = await validarEntrada(id, 2);
    expect(segunda.status).toBe(200);
    expect(segunda.body.entradas.every((e) => e.fechaUso !== null)).toBe(true);
    const repetida = await validarEntrada(id, 2);
    expect(repetida.status).toBe(422);
    expect(repetida.body.message).toBe("Esta entrada ya fue utilizada");
  });

  it("Ana ve sus entradas en el detalle, sin poder validarlas", async () => {
    const id = await idDeCompra(ANA, PRIMAVERA);
    const res = await pedirComo(app, request(app).get(`/compras/${id}`), ANA);
    expect(res.body.entradas).toEqual([
      { numero: 1, fechaUso: null, puedeValidarse: false },
      { numero: 2, fechaUso: null, puedeValidarse: false },
    ]);
  });

  it("una compra PENDIENTE responde 422", async () => {
    const res = await validarEntrada(await idDeCompra(ANA, "Los Piojos en River"), 1);
    expect(res.status).toBe(422);
    expect(res.body.message).toBe("La compra todavía no está pagada");
  });

  it("responde 404 sin compra o sin entrada y 400 con números inválidos", async () => {
    const id = await idDeCompra(ANA, PRIMAVERA);
    const sinEntrada = await validarEntrada(id, 9);
    expect(sinEntrada.status).toBe(404);
    expect(sinEntrada.body.message).toBe("No existe la entrada");
    expect((await validarEntrada(999, 1)).body.message).toBe("No existe la compra");
    expect((await validarEntrada(id, "abc")).status).toBe(400);
    expect((await validarEntrada(id, 0)).status).toBe(400);
  });
});

describe("GET /eventos/:id/compras", () => {
  it("Fénix ve la disponibilidad y las compras de Primavera Sonora, de la más nueva a la más vieja", async () => {
    const id = await idDeEvento(PRIMAVERA);
    const res = await comprasDelEvento(id);
    expect(res.status).toBe(200);
    expect(res.body.evento).toEqual({ id, nombre: PRIMAVERA });
    expect(res.body.disponibilidad).toMatchObject([
      { nombre: "General", cupo: 3000, vendidas: 2, disponibles: 2998 },
      { nombre: "VIP", cupo: 20, vendidas: 18, disponibles: 2 },
    ]);
    expect(res.body).toMatchObject({ total: 2, page: 1, totalPages: 1 });
    expect(res.body.compras).toMatchObject([
      { estado: "CONFIRMADA", comprador: { nombre: "Ana Pérez" } },
      { estado: "CONFIRMADA", comprador: { nombre: expect.stringContaining("Bruno") } },
    ]);
    expect(res.body.compras.every((c) => c.acciones.puedeMarcarUtilizada)).toBe(true);
  });

  it("con estado=PENDIENTE la lista viene vacía pero la disponibilidad no cambia", async () => {
    const res = await comprasDelEvento(await idDeEvento(PRIMAVERA), { estado: "PENDIENTE" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ compras: [], total: 0 });
    expect(res.body.disponibilidad.map((d) => d.vendidas)).toEqual([2, 18]);
  });

  it("un evento inexistente responde 404, un id inválido 400 y limit=51 400", async () => {
    const inexistente = await comprasDelEvento(999);
    expect(inexistente.status).toBe(404);
    expect(inexistente.body.message).toBe("No existe el evento");
    expect((await comprasDelEvento("abc")).status).toBe(400);
    expect((await comprasDelEvento(await idDeEvento(PRIMAVERA), { limit: 51 })).status).toBe(400);
  });
});

describe.each([
  [
    "POST /compras/:id/uso",
    async (email) => marcarUtilizada(await idDeCompra(BRUNO, PRIMAVERA), email),
  ],
  [
    "GET /eventos/:id/compras",
    async (email) => comprasDelEvento(await idDeEvento(PRIMAVERA), {}, email),
  ],
  [
    "POST /compras/:id/entradas/:numero/uso",
    async (email) => validarEntrada(await idDeCompra(BRUNO, PRIMAVERA), 1, email),
  ],
])("permisos de %s", (_endpoint, pedir) => {
  it.each([
    ["Konex con un evento de Fénix", KONEX, 403],
    ["Ana (compradora)", ANA, 403],
    ["sin token", null, 401],
  ])("%s responde %i", async (_caso, email, status) => {
    const res = await pedir(email);
    expect(res.status).toBe(status);
    if (status === 403) expect(res.body.message).toBe(MENSAJE_SIN_PERMISO);
  });
});

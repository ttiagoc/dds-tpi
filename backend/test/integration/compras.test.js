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
import { enDias } from "../helpers/domainFactories.js";
import { MENSAJE_SIN_PERMISO as SIN_PERMISO } from "../../src/errors/mensajes.js";

let app;
let contenedor;

beforeEach(async () => {
  ({ app, contenedor } = await crearAppDePrueba());
});

const comprar = (body, email = ANA) =>
  pedirComo(app, request(app).post("/compras").send(body), email);
const listar = (query = {}, email = ANA) =>
  pedirComo(app, request(app).get("/compras").query(query), email);
const obtener = (id, email = ANA) => pedirComo(app, request(app).get(`/compras/${id}`), email);
const accion = (id, ruta, email = ANA) =>
  pedirComo(app, request(app).post(`/compras/${id}/${ruta}`), email);

const evento = (nombre) => eventoDelSeed(contenedor, nombre);
const idDeCompra = (email, nombreEvento) => idDeCompraDelSeed(contenedor, email, nombreEvento);

async function bodyDeCompra(nombreEvento, nombreTipo, cantidad) {
  const { id, tiposEntrada } = await evento(nombreEvento);
  const tipo = tiposEntrada.find((t) => t.nombre === nombreTipo);
  return { eventoId: id, tipoEntradaId: tipo.id, cantidad };
}

describe("POST /compras", () => {
  it("crea la compra PENDIENTE de Ana y descuenta el cupo", async () => {
    const body = await bodyDeCompra("Los Piojos en River", "Campo", 2);
    const antes = (await evento("Los Piojos en River"))
      .tipoEntrada(body.tipoEntradaId)
      .disponibles();
    const res = await comprar(body);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      estado: "PENDIENTE",
      total: 90000,
      comprador: { nombre: "Ana Pérez" },
      historial: [{ estado: "PENDIENTE" }],
      acciones: { puedePagar: true, puedeCancelar: true },
      resenia: null,
    });
    const detalleEvento = await request(app).get(`/eventos/${body.eventoId}`);
    const campo = detalleEvento.body.tiposEntrada.find((t) => t.id === body.tipoEntradaId);
    expect(campo.disponibles).toBe(antes - 2);
  });

  it.each([
    ["cantidad 11", { cantidad: 11 }],
    ["cantidad 0", { cantidad: 0 }],
    ["un campo de más", { total: 1 }],
  ])("con %s responde 400", async (_caso, overrides) => {
    const body = await bodyDeCompra("Los Piojos en River", "Campo", 2);
    const res = await comprar({ ...body, ...overrides });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Datos inválidos");
  });

  it("con un evento inexistente responde 404", async () => {
    const res = await comprar({ eventoId: 999, tipoEntradaId: 1, cantidad: 1 });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No existe el evento");
  });

  it("con un tipo que el evento no tiene responde 404", async () => {
    const { eventoId } = await bodyDeCompra("Noche de Tango", "General", 1);
    const res = await comprar({ eventoId, tipoEntradaId: 2, cantidad: 1 });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No existe el tipo de entrada 2 en este evento");
  });

  it.each([
    [
      "un evento que ya ocurrió",
      ["Rock en el Parque", "Campo", 1],
      "No podés comprar entradas de un evento que ya ocurrió",
    ],
    [
      "más entradas que el cupo",
      ["Festival Primavera Sonora", "VIP", 3],
      "No hay cupo suficiente para VIP",
    ],
  ])("con %s responde 422", async (_caso, [nombreEvento, tipo, cantidad], mensaje) => {
    const res = await comprar(await bodyDeCompra(nombreEvento, tipo, cantidad));
    expect(res.status).toBe(422);
    expect(res.body.message).toBe(mensaje);
  });

  it("sin token responde 401 y como organizador 403", async () => {
    const body = await bodyDeCompra("Los Piojos en River", "Campo", 1);
    expect((await comprar(body, null)).status).toBe(401);
    const res = await comprar(body, FENIX);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(SIN_PERMISO);
  });
});

describe("GET /compras", () => {
  it("trae las 8 compras de Ana: primero las próximas y después las pasadas", async () => {
    const res = await listar();
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 8, page: 1, totalPages: 1 });
    expect(res.body.compras.map((c) => c.evento.nombre)).toEqual([
      "Noche de Stand-up",
      "Noche de Tango",
      "Los Piojos en River",
      "Clásico de Básquet",
      "Hamlet",
      "Festival Primavera Sonora",
      "Impro Total",
      "Rock en el Parque",
    ]);
    const compra = (nombre) => res.body.compras.find((c) => c.evento.nombre === nombre);
    expect(compra("Festival Primavera Sonora").diasRestantes).toBe(40);
    expect(compra("Noche de Stand-up").diasRestantes).toBe(1);
    const noConfirmadas = res.body.compras.filter((c) => c.estado !== "CONFIRMADA");
    expect(noConfirmadas).toHaveLength(6);
    expect(noConfirmadas.every((c) => c.diasRestantes === null)).toBe(true);
    expect(compra("Rock en el Parque").acciones.puedeReseniar).toBe(false);
    expect(compra("Noche de Tango").acciones.puedeReseniar).toBe(true);
  });

  it("filtra por estado", async () => {
    const res = await listar({ estado: "CONFIRMADA" });
    expect(res.body.compras.map((c) => c.estado)).toEqual(["CONFIRMADA", "CONFIRMADA"]);
  });

  it.each([[{ estado: "PAGADA" }], [{ limit: 51 }]])("con %p responde 400", async (query) => {
    const res = await listar(query);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Parámetros de consulta inválidos");
  });

  it("sin token responde 401 y como organizador 403", async () => {
    expect((await listar({}, null)).status).toBe(401);
    expect((await listar({}, FENIX)).status).toBe(403);
  });
});

describe("GET /compras/:id", () => {
  it("Ana ve el historial y la reseña de su compra de Rock en el Parque", async () => {
    const res = await obtener(await idDeCompra(ANA, "Rock en el Parque"));
    expect(res.status).toBe(200);
    expect(res.body.historial.map((c) => [c.estado, c.quien.nombre])).toEqual([
      ["PENDIENTE", "Ana Pérez"],
      ["CONFIRMADA", "Ana Pérez"],
      ["UTILIZADA", "Fénix Producciones"],
    ]);
    expect(res.body.resenia).toMatchObject({ puntuacion: 5 });
  });

  it("el organizador del evento también la ve", async () => {
    const res = await obtener(await idDeCompra(ANA, "Rock en el Parque"), FENIX);
    expect(res.status).toBe(200);
  });

  it.each([
    ["Bruno", BRUNO],
    ["Konex", KONEX],
  ])("%s recibe 403", async (_caso, email) => {
    const res = await obtener(await idDeCompra(ANA, "Rock en el Parque"), email);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(SIN_PERMISO);
  });

  it("una compra inexistente responde 404 y un id inválido 400", async () => {
    const inexistente = await obtener(999);
    expect(inexistente.status).toBe(404);
    expect(inexistente.body.message).toBe("No existe la compra");
    expect((await obtener("abc")).status).toBe(400);
  });
});

describe("POST /compras/:id/pago", () => {
  it("confirma la compra PENDIENTE de Ana y no deja pagarla dos veces", async () => {
    const id = await idDeCompra(ANA, "Los Piojos en River");
    const res = await accion(id, "pago");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado: "CONFIRMADA", diasRestantes: 12 });
    expect(res.body.historial.map((c) => c.estado)).toEqual(["PENDIENTE", "CONFIRMADA"]);

    const otraVez = await accion(id, "pago");
    expect(otraVez.status).toBe(422);
    expect(otraVez.body.message).toBe("No se puede pasar de CONFIRMADA a CONFIRMADA");
  });

  it("una compra de un evento que ya ocurrió responde 422", async () => {
    const id = await idDeCompra(ANA, "Los Piojos en River");
    (await evento("Los Piojos en River")).fecha = enDias(-1);
    const res = await accion(id, "pago");
    expect(res.status).toBe(422);
    expect(res.body.message).toBe("No podés pagar una compra de un evento que ya ocurrió");
  });
});

describe("POST /compras/:id/cancelacion", () => {
  it("reembolsa la compra CONFIRMADA de Ana y devuelve el cupo", async () => {
    const id = await idDeCompra(ANA, "Festival Primavera Sonora");
    const general = (await evento("Festival Primavera Sonora")).tiposEntrada[0];
    const antes = general.disponibles();
    const res = await accion(id, "cancelacion");
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("REEMBOLSADA");
    expect(res.body.historial.map((c) => c.estado)).toEqual([
      "PENDIENTE",
      "CONFIRMADA",
      "CANCELADA",
      "REEMBOLSADA",
    ]);
    expect(general.disponibles()).toBe(antes + 2);
  });

  it("cancela la compra PENDIENTE de Ana sin reembolso y devuelve el cupo", async () => {
    const campo = (await evento("Los Piojos en River")).tiposEntrada[0];
    const antes = campo.disponibles();
    const res = await accion(await idDeCompra(ANA, "Los Piojos en River"), "cancelacion");
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("CANCELADA");
    expect(res.body.historial.map((c) => c.estado)).toEqual(["PENDIENTE", "CANCELADA"]);
    expect(campo.disponibles()).toBe(antes + 2);
  });

  it("una compra de un evento que ya ocurrió responde 422", async () => {
    const id = await idDeCompra(ANA, "Festival Primavera Sonora");
    (await evento("Festival Primavera Sonora")).fecha = enDias(-1);
    const res = await accion(id, "cancelacion");
    expect(res.status).toBe(422);
    expect(res.body.message).toBe("No podés cancelar una compra de un evento que ya ocurrió");
  });

  it.each([
    ["utilizada", "Noche de Tango", "No podés cancelar una compra utilizada"],
    ["ya cancelada", "Hamlet", "La compra ya está cancelada"],
  ])("una compra %s responde 422", async (_caso, nombreEvento, mensaje) => {
    const res = await accion(await idDeCompra(ANA, nombreEvento), "cancelacion");
    expect(res.status).toBe(422);
    expect(res.body.message).toBe(mensaje);
  });
});

describe.each(["pago", "cancelacion"])("errores comunes de POST /compras/:id/%s", (ruta) => {
  it.each([
    ["sin token", null, 401, "Necesitás iniciar sesión"],
    ["como organizador", FENIX, 403, SIN_PERMISO],
    ["como otro comprador", BRUNO, 403, SIN_PERMISO],
  ])("%s responde %i", async (_caso, email, status, mensaje) => {
    const res = await accion(await idDeCompra(ANA, "Los Piojos en River"), ruta, email);
    expect(res.status).toBe(status);
    expect(res.body.message).toBe(mensaje);
  });

  it("una compra inexistente responde 404 y un id inválido 400", async () => {
    const inexistente = await accion(999, ruta);
    expect(inexistente.status).toBe(404);
    expect(inexistente.body.message).toBe("No existe la compra");
    expect((await accion("abc", ruta)).status).toBe(400);
  });
});

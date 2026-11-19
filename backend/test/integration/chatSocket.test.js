import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import {
  loginComo,
  conToken,
  idDeCompraDelSeed,
  ANA,
  BRUNO,
  FENIX,
  KONEX,
} from "../helpers/appDePrueba.js";
import {
  levantarServidorDePrueba,
  unirse,
  esperarEvento,
  esperarSilencio,
  recibidosDurante,
} from "../helpers/socketDePrueba.js";
import { leerEntorno } from "../../src/config/entorno.js";
import {
  MENSAJE_COMPRA_INEXISTENTE,
  MENSAJE_ERROR_CHAT,
  MENSAJE_NO_AUTENTICADO,
  MENSAJE_SIN_PERMISO,
} from "../../src/errors/mensajes.js";

const PRIMAVERA = "Festival Primavera Sonora";
const ID_INVALIDO = "El id debe ser un entero positivo";

let servidor;
let app;
let contenedor;

beforeEach(async () => {
  servidor = await levantarServidorDePrueba();
  ({ app, contenedor } = servidor);
});

afterEach(async () => {
  jest.restoreAllMocks();
  await servidor.cerrar();
});

const idDeCompra = (nombreEvento) => idDeCompraDelSeed(contenedor, ANA, nombreEvento);

async function conectarComo(email) {
  const token = await loginComo(app, email);
  return { token, cliente: await servidor.conectar(token) };
}

async function unidoA(email, compraId) {
  const conexion = await conectarComo(email);
  expect(await unirse(conexion.cliente, compraId)).toEqual({ ok: true });
  return conexion;
}

const postComo = (token, ruta, body) => conToken(request(app).post(ruta).send(body), token);
const escribir = (token, id, mensaje = "Hola") =>
  postComo(token, `/compras/${id}/mensajes`, { mensaje });
const recibeCuandoEscribe = (cliente, autor, id) =>
  recibidosDurante(cliente, "mensaje:nuevo", () => escribir(autor.token, id), {
    testigo: autor.cliente,
  });

describe("mensaje:nuevo", () => {
  it("Ana y Fénix reciben en vivo el mensaje que manda Ana", async () => {
    const id = await idDeCompra(PRIMAVERA);
    const ana = await unidoA(ANA, id);
    const fenix = await unidoA(FENIX, id);
    const llegaAFenix = esperarEvento(fenix.cliente, "mensaje:nuevo");
    const llegaAAna = esperarEvento(ana.cliente, "mensaje:nuevo");

    const res = await escribir(ana.token, id, "¿Hay guardarropas?");

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(3);
    expect(await llegaAFenix).toEqual(res.body);
    expect(await llegaAAna).toEqual(res.body);
  });

  it("unirse dos veces no duplica la entrega", async () => {
    const id = await idDeCompra(PRIMAVERA);
    const fenix = await unidoA(FENIX, id);
    expect(await unirse(fenix.cliente, id)).toEqual({ ok: true });
    const ana = await conectarComo(ANA);
    const recibidos = await recibidosDurante(
      fenix.cliente,
      "mensaje:nuevo",
      () => escribir(ana.token, id),
      { testigo: fenix.cliente },
    );
    expect(recibidos).toHaveLength(1);
  });

  it("después de compra:salir no llegan más mensajes", async () => {
    const id = await idDeCompra(PRIMAVERA);
    const ana = await unidoA(ANA, id);
    const fenix = await unidoA(FENIX, id);
    fenix.cliente.emit("compra:salir", { compraId: String(id) });
    await esperarSilencio();
    expect(await recibeCuandoEscribe(fenix.cliente, ana, id)).toEqual([]);
  });

  it("sin nadie en el room, el POST y el pago responden igual", async () => {
    const { token } = await conectarComo(ANA);
    expect((await escribir(token, await idDeCompra(PRIMAVERA))).status).toBe(201);
    const piojos = await idDeCompra("Los Piojos en River");
    expect((await postComo(token, `/compras/${piojos}/pago`)).status).toBe(200);
  });
});

describe("handshake", () => {
  it("acepta conexiones por long-polling, el transporte inicial del cliente", async () => {
    const token = await loginComo(app, ANA);
    const cliente = await servidor.conectar(token, { transports: ["polling"] });
    expect(await unirse(cliente, await idDeCompra(PRIMAVERA))).toEqual({ ok: true });
  });

  const firmar = (subject, opciones = {}) =>
    jwt.sign({ rol: "COMPRADOR" }, leerEntorno({ NODE_ENV: "test" }).jwtSecret, {
      algorithm: "HS256",
      subject,
      ...opciones,
    });

  it.each([
    ["sin token", () => null],
    ["con un token inválido", () => "no-es-un-jwt"],
    ["con un token vencido", () => firmar("1", { expiresIn: -10 })],
    ["con el token de un usuario inexistente", () => firmar("999")],
  ])("rechaza la conexión %s con connect_error", async (_caso, token) => {
    await expect(servidor.conectar(token())).rejects.toThrow(MENSAJE_NO_AUTENTICADO);
  });
});

describe("compra:unirse y compra:salir", () => {
  it.each([
    ["Bruno (comprador ajeno)", BRUNO],
    ["Konex (organizador de otro evento)", KONEX],
  ])("%s no puede unirse a la compra de Ana", async (_caso, email) => {
    const { cliente } = await conectarComo(email);
    expect(await unirse(cliente, await idDeCompra(PRIMAVERA))).toEqual({
      ok: false,
      error: MENSAJE_SIN_PERMISO,
    });
  });

  it.each([
    [999, MENSAJE_COMPRA_INEXISTENTE],
    ["abc", ID_INVALIDO],
    [undefined, ID_INVALIDO],
  ])("con compraId %p responde ok false", async (compraId, error) => {
    const { cliente } = await conectarComo(ANA);
    expect(await unirse(cliente, compraId)).toEqual({ ok: false, error });
  });

  it("un error inesperado se loguea y responde un mensaje genérico", async () => {
    const consola = jest.spyOn(console, "error").mockImplementation(() => {});
    jest
      .spyOn(contenedor.servicios.mensajeService, "verificarParticipante")
      .mockRejectedValue(new Error("repo caído"));
    const { cliente } = await conectarComo(ANA);
    expect(await unirse(cliente, 1)).toEqual({ ok: false, error: MENSAJE_ERROR_CHAT });
    expect(consola).toHaveBeenCalled();
  });

  it("quien no pudo unirse no recibe los mensajes de la compra", async () => {
    const id = await idDeCompra(PRIMAVERA);
    const ana = await unidoA(ANA, id);
    const bruno = await conectarComo(BRUNO);
    await unirse(bruno.cliente, id);
    expect(await recibeCuandoEscribe(bruno.cliente, ana, id)).toEqual([]);
  });

  it("salir sin haberse unido o con un payload inválido no rompe la conexión", async () => {
    const { cliente } = await conectarComo(ANA);
    cliente.emit("compra:salir", { compraId: 999 });
    cliente.emit("compra:salir", {});
    cliente.emit("compra:salir");
    await esperarSilencio();
    expect(cliente.connected).toBe(true);
    expect(await unirse(cliente, await idDeCompra(PRIMAVERA))).toEqual({ ok: true });
  });
});

describe("compra:estado", () => {
  it("al pagar, Ana y Fénix reciben CONFIRMADA", async () => {
    const id = await idDeCompra("Los Piojos en River");
    const ana = await unidoA(ANA, id);
    const fenix = await unidoA(FENIX, id);
    const llegaAFenix = esperarEvento(fenix.cliente, "compra:estado");
    const llegaAAna = esperarEvento(ana.cliente, "compra:estado");
    expect((await postComo(ana.token, `/compras/${id}/pago`)).status).toBe(200);
    expect(await llegaAFenix).toEqual({ compraId: id, estado: "CONFIRMADA" });
    expect(await llegaAAna).toEqual({ compraId: id, estado: "CONFIRMADA" });
  });

  it("al cancelar una compra confirmada llega un único evento con REEMBOLSADA", async () => {
    const id = await idDeCompra("Noche de Stand-up");
    const ana = await unidoA(ANA, id);
    const konex = await unidoA(KONEX, id);
    const cancelar = async () =>
      expect((await postComo(ana.token, `/compras/${id}/cancelacion`)).status).toBe(200);
    const recibidos = await recibidosDurante(konex.cliente, "compra:estado", cancelar, {
      testigo: konex.cliente,
    });
    expect(recibidos).toEqual([{ compraId: id, estado: "REEMBOLSADA" }]);
  });

  it("al marcar utilizada, Ana recibe UTILIZADA", async () => {
    const id = await idDeCompra(PRIMAVERA);
    const ana = await unidoA(ANA, id);
    const fenix = await conectarComo(FENIX);
    const llega = esperarEvento(ana.cliente, "compra:estado");
    expect((await postComo(fenix.token, `/compras/${id}/uso`)).status).toBe(200);
    expect(await llega).toEqual({ compraId: id, estado: "UTILIZADA" });
  });

  it("si la acción falla no se emite nada", async () => {
    const id = await idDeCompra(PRIMAVERA);
    const ana = await unidoA(ANA, id);
    const pagarDosVeces = async () =>
      expect((await postComo(ana.token, `/compras/${id}/pago`)).status).toBe(422);
    const recibidos = await recibidosDurante(ana.cliente, "compra:estado", pagarDosVeces);
    expect(recibidos).toEqual([]);
  });
});

describe("conversacion:actualizada", () => {
  it("le llega a la otra parte en su sala de usuario, sin unirse a la compra", async () => {
    const id = await idDeCompra(PRIMAVERA);
    const fenix = await conectarComo(FENIX);
    const ana = await conectarComo(ANA);
    const llega = esperarEvento(fenix.cliente, "conversacion:actualizada");

    const res = await escribir(ana.token, id, "¿Hay estacionamiento?");

    expect(await llega).toEqual({ compraId: id, ultimoMensaje: res.body, noLeidos: 1 });
  });

  it("no le llega al autor", async () => {
    const id = await idDeCompra(PRIMAVERA);
    const ana = await conectarComo(ANA);
    const recibidos = await recibidosDurante(ana.cliente, "conversacion:actualizada", () =>
      escribir(ana.token, id),
    );
    expect(recibidos).toEqual([]);
  });
});

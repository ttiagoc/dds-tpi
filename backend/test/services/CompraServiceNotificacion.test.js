import { describe, it, expect, beforeEach } from "@jest/globals";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";
import { crearEvento, crearCompra } from "../helpers/domainFactories.js";
import {
  ana,
  usuarioAna,
  usuarioBruno,
  usuarioFenix,
  usuarioKonex,
  servicioDeCompras,
} from "../helpers/comprasFake.js";

const { PENDIENTE, CONFIRMADA, UTILIZADA, REEMBOLSADA, CANCELADA } = EstadoCompra;

let compras;
let eventos;
let repos;
let notificador;
let service;

const compraDeAna = (estado) => crearCompra({ id: 7, estado, evento: eventos[0], comprador: ana });

beforeEach(() => {
  eventos = [crearEvento({ id: 1 })];
  compras = [];
  ({ repos, notificador, service } = servicioDeCompras(() => ({
    compras,
    eventos,
    resenias: [],
  })));
});

describe("CompraService notifica el estado final de la compra", () => {
  it.each([
    ["pagar", PENDIENTE, usuarioAna, CONFIRMADA],
    ["cancelar", PENDIENTE, usuarioAna, CANCELADA],
    ["cancelar", CONFIRMADA, usuarioAna, REEMBOLSADA],
    ["marcarUtilizada", CONFIRMADA, usuarioFenix, UTILIZADA],
  ])("%s desde %s emite una sola vez el estado %s", async (accion, desde, usuario, final) => {
    compras = [compraDeAna(desde)];
    await service[accion](7, usuario);
    expect(notificador.estadoCompra).toHaveBeenCalledTimes(1);
    expect(notificador.estadoCompra).toHaveBeenCalledWith(7, final);
  });

  it("notifica después de guardar", async () => {
    compras = [compraDeAna(PENDIENTE)];
    await service.pagar(7, usuarioAna);
    const guardado = repos.compraRepository.save.mock.invocationCallOrder[0];
    const notificado = notificador.estadoCompra.mock.invocationCallOrder[0];
    expect(guardado).toBeLessThan(notificado);
  });

  it.each([
    ["pagar una compra inexistente (404)", "pagar", 999, usuarioAna, PENDIENTE],
    ["pagar la compra de otro (403)", "pagar", 7, usuarioBruno, PENDIENTE],
    ["pagar dos veces (422)", "pagar", 7, usuarioAna, CONFIRMADA],
    ["marcar utilizada un evento ajeno (403)", "marcarUtilizada", 7, usuarioKonex, CONFIRMADA],
  ])("no notifica al %s", async (_caso, accion, id, usuario, estado) => {
    compras = [compraDeAna(estado)];
    await expect(service[accion](id, usuario)).rejects.toThrow();
    expect(notificador.estadoCompra).not.toHaveBeenCalled();
  });

  it("no notifica al crear una compra", async () => {
    await service.crear({ eventoId: 1, tipoEntradaId: 1, cantidad: 1 }, usuarioAna);
    expect(notificador.estadoCompra).not.toHaveBeenCalled();
  });
});

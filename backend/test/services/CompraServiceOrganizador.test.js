import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  MENSAJE_COMPRA_INEXISTENTE,
  MENSAJE_EVENTO_INEXISTENTE,
  MENSAJE_SIN_PERMISO,
} from "../../src/errors/mensajes.js";
import {
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../src/errors/AppError.js";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";
import { AHORA, enDias, crearEvento, crearCompra } from "../helpers/domainFactories.js";
import {
  ana,
  bruno,
  fenix,
  konex,
  usuarioFenix,
  usuarioKonex,
  servicioDeCompras,
} from "../helpers/comprasFake.js";

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA } = EstadoCompra;

let eventos;
let compras;
let resenias;
let repos;
let reloj;
let service;

function compraDel(evento, { id, estado = CONFIRMADA, comprador = ana, haceDias = 0, ...resto }) {
  const compra = crearCompra({ id, estado, evento, comprador, ...resto });
  compra.fechaCompra = enDias(-haceDias);
  return compra;
}

beforeEach(() => {
  eventos = [crearEvento({ id: 1 }), crearEvento({ id: 2, organizador: konex })];
  compras = [];
  resenias = [];
  ({ repos, reloj, service } = servicioDeCompras(() => ({ compras, eventos, resenias })));
});

describe("CompraService.marcarUtilizada", () => {
  it("marca la compra UTILIZADA antes de la fecha del evento, guarda y devuelve el detalle", async () => {
    compras = [compraDel(eventos[0], { id: 7 })];
    const vendidasAntes = eventos[0].tipoEntrada(1).vendidas;
    const detalle = await service.marcarUtilizada(7, usuarioFenix);
    expect(detalle).toMatchObject({
      id: 7,
      estado: UTILIZADA,
      diasRestantes: null,
      acciones: {
        puedePagar: false,
        puedeCancelar: false,
        puedeMarcarUtilizada: false,
        puedeReseniar: false,
      },
      resenia: null,
    });
    expect(detalle.historial.at(-1)).toEqual({
      estado: UTILIZADA,
      quien: { id: fenix.id, nombre: "Fénix Producciones" },
      fechaHora: AHORA.toISOString(),
    });
    expect(repos.compraRepository.save).toHaveBeenCalledWith(compras[0]);
    expect(repos.eventoRepository.save).toHaveBeenCalledWith(eventos[0]);
    expect(eventos[0].tipoEntrada(1).vendidas).toBe(vendidasAntes);
    expect(reloj.ahora).toHaveBeenCalledTimes(1);
  });

  it("rechaza una compra inexistente con 404", async () => {
    const promesa = service.marcarUtilizada(999, usuarioFenix);
    await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
    await expect(promesa).rejects.toThrow(MENSAJE_COMPRA_INEXISTENTE);
  });

  it("rechaza con 403 si el evento es de otro organizador, sin guardar", async () => {
    compras = [compraDel(eventos[0], { id: 7 })];
    const promesa = service.marcarUtilizada(7, usuarioKonex);
    await expect(promesa).rejects.toBeInstanceOf(ForbiddenError);
    await expect(promesa).rejects.toThrow(MENSAJE_SIN_PERMISO);
    expect(repos.compraRepository.save).not.toHaveBeenCalled();
  });

  it("propaga el error de transición desde un estado distinto de CONFIRMADA, sin guardar", async () => {
    compras = [compraDel(eventos[0], { id: 7, estado: PENDIENTE })];
    const promesa = service.marcarUtilizada(7, usuarioFenix);
    await expect(promesa).rejects.toBeInstanceOf(UnprocessableEntityError);
    await expect(promesa).rejects.toThrow("No se puede pasar de PENDIENTE a UTILIZADA");
    expect(repos.compraRepository.save).not.toHaveBeenCalled();
  });
});

describe("CompraService.listarDelEvento", () => {
  const PAGINA = { page: 1, limit: 20 };
  const ids = (resultado) => resultado.compras.map((c) => c.id);

  it("rechaza un evento inexistente con 404", async () => {
    const promesa = service.listarDelEvento(999, usuarioFenix, PAGINA);
    await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
    await expect(promesa).rejects.toThrow(MENSAJE_EVENTO_INEXISTENTE);
  });

  it("rechaza con 403 un evento de otro organizador", async () => {
    const promesa = service.listarDelEvento(2, usuarioFenix, PAGINA);
    await expect(promesa).rejects.toBeInstanceOf(ForbiddenError);
    await expect(promesa).rejects.toThrow(MENSAJE_SIN_PERMISO);
    expect(repos.compraRepository.findByEvento).not.toHaveBeenCalled();
  });

  it("devuelve el evento, la disponibilidad por tipo y las compras paginadas", async () => {
    compras = [
      compraDel(eventos[0], { id: 1, cantidad: 3 }),
      compraDel(eventos[0], { id: 2, tipoEntradaId: 2, cantidad: 1, comprador: bruno }),
    ];
    const resultado = await service.listarDelEvento(1, usuarioFenix, PAGINA);
    expect(resultado).toMatchObject({
      evento: { id: 1, nombre: "Los Piojos en River" },
      disponibilidad: [
        { tipoEntradaId: 1, nombre: "Campo", cupo: 10, vendidas: 3, disponibles: 7 },
        { tipoEntradaId: 2, nombre: "Platea", cupo: 5, vendidas: 1, disponibles: 4 },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    });
    expect(resultado.evento).toEqual({ id: 1, nombre: "Los Piojos en River" });
    expect(resultado.compras[1]).toMatchObject({
      comprador: { id: 3, nombre: "Ana Pérez" },
      acciones: {
        puedePagar: false,
        puedeCancelar: false,
        puedeMarcarUtilizada: true,
        puedeReseniar: false,
      },
    });
    expect(resultado.compras[1].historial).toBeUndefined();
  });

  it("ordena por fechaCompra desc y después por id desc", async () => {
    compras = [
      compraDel(eventos[0], { id: 1, haceDias: 5, cantidad: 1 }),
      compraDel(eventos[0], { id: 2, haceDias: 1, cantidad: 1 }),
      compraDel(eventos[0], { id: 3, haceDias: 5, cantidad: 1 }),
      compraDel(eventos[0], { id: 4, haceDias: 3, cantidad: 1 }),
    ];
    expect(ids(await service.listarDelEvento(1, usuarioFenix, PAGINA))).toEqual([2, 4, 3, 1]);
  });

  it("filtra por estado sin cambiar la disponibilidad", async () => {
    compras = [
      compraDel(eventos[0], { id: 1, cantidad: 2 }),
      compraDel(eventos[0], { id: 2, estado: PENDIENTE, cantidad: 1 }),
      compraDel(eventos[0], { id: 3, estado: CANCELADA, cantidad: 4 }),
    ];
    const resultado = await service.listarDelEvento(1, usuarioFenix, {
      ...PAGINA,
      estado: PENDIENTE,
    });
    expect(ids(resultado)).toEqual([2]);
    expect(resultado.total).toBe(1);
    expect(resultado.disponibilidad[0]).toMatchObject({ vendidas: 3, disponibles: 7 });
  });

  it("pagina las compras", async () => {
    compras = [1, 2, 3].map((id) => compraDel(eventos[0], { id, haceDias: id, cantidad: 1 }));
    const resultado = await service.listarDelEvento(1, usuarioFenix, { page: 2, limit: 2 });
    expect(ids(resultado)).toEqual([3]);
    expect(resultado).toMatchObject({ total: 3, page: 2, totalPages: 2 });
  });

  it("marca puedeReseniar false aunque esté utilizada, porque las acciones son del organizador", async () => {
    compras = [compraDel(eventos[0], { id: 1, estado: UTILIZADA })];
    const [compra] = (await service.listarDelEvento(1, usuarioFenix, PAGINA)).compras;
    expect(compra.acciones).toEqual({
      puedePagar: false,
      puedeCancelar: false,
      puedeMarcarUtilizada: false,
      puedeReseniar: false,
    });
  });

  it("usa el reloj una sola vez", async () => {
    compras = [compraDel(eventos[0], { id: 1 }), compraDel(eventos[0], { id: 2 })];
    await service.listarDelEvento(1, usuarioFenix, PAGINA);
    expect(reloj.ahora).toHaveBeenCalledTimes(1);
  });
});

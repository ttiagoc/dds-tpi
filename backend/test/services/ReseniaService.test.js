import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { ReseniaService } from "../../src/services/ReseniaService.js";
import {
  MENSAJE_COMPRA_INEXISTENTE,
  MENSAJE_COMPRA_RESENIADA,
  MENSAJE_ORGANIZADOR_INEXISTENTE,
  MENSAJE_SIN_PERMISO,
} from "../../src/errors/mensajes.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../src/errors/AppError.js";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";
import {
  AHORA,
  enDias,
  crearEvento,
  crearCompra,
  crearResenia,
} from "../helpers/domainFactories.js";
import {
  ana,
  fenix,
  konex,
  usuarioAna,
  usuarioBruno,
  usuarioRepositoryFake,
} from "../helpers/comprasFake.js";

const { CONFIRMADA, UTILIZADA } = EstadoCompra;
const BODY = { puntuacion: 4, detalle: "Muy lindo show" };

let compras;
let resenias;
let repos;
let reloj;
let service;

let eventoDeFenix;

beforeEach(() => {
  eventoDeFenix = crearEvento({ id: 1, nombre: "Rock en el Parque" });
  compras = [];
  resenias = [];
  repos = {
    compraRepository: {
      findById: jest.fn(async (id) => compras.find((c) => c.id === id) ?? null),
    },
    reseniaRepository: {
      findByCompraId: jest.fn(async (id) => resenias.find((r) => r.compraId === id) ?? null),
      findByOrganizador: jest.fn(async (id) => resenias.filter((r) => r.evento.esDe(id))),
      save: jest.fn(async (resenia) => {
        resenia.id ??= 50;
        return resenia;
      }),
    },
    usuarioRepository: usuarioRepositoryFake(),
  };
  reloj = { ahora: jest.fn(() => AHORA) };
  service = new ReseniaService({ ...repos, reloj });
});

describe("ReseniaService.crear", () => {
  const compraDeAna = (estado = UTILIZADA) =>
    crearCompra({ id: 7, estado, evento: eventoDeFenix, comprador: ana });

  it("crea la reseña de una compra utilizada con la fecha de ahora y la devuelve", async () => {
    compras = [compraDeAna()];
    const resenia = await service.crear(7, BODY, usuarioAna);
    expect(resenia).toEqual({
      id: 50,
      compraId: 7,
      puntuacion: 4,
      detalle: "Muy lindo show",
      fecha: AHORA.toISOString(),
      evento: { id: 1, nombre: "Rock en el Parque" },
      comprador: { nombre: "Ana Pérez" },
    });
    expect(repos.reseniaRepository.save).toHaveBeenCalledTimes(1);
    expect(reloj.ahora).toHaveBeenCalledTimes(1);
  });

  it("rechaza una compra inexistente con 404", async () => {
    const promesa = service.crear(999, BODY, usuarioAna);
    await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
    await expect(promesa).rejects.toThrow(MENSAJE_COMPRA_INEXISTENTE);
  });

  it("rechaza con 403 la compra de otro comprador", async () => {
    compras = [compraDeAna()];
    const promesa = service.crear(7, BODY, usuarioBruno);
    await expect(promesa).rejects.toBeInstanceOf(ForbiddenError);
    await expect(promesa).rejects.toThrow(MENSAJE_SIN_PERMISO);
    expect(repos.reseniaRepository.save).not.toHaveBeenCalled();
  });

  it("rechaza con 409 una compra ya reseñada", async () => {
    compras = [compraDeAna()];
    resenias = [crearResenia({ compra: compras[0] })];
    const promesa = service.crear(7, BODY, usuarioAna);
    await expect(promesa).rejects.toBeInstanceOf(ConflictError);
    await expect(promesa).rejects.toThrow(MENSAJE_COMPRA_RESENIADA);
    expect(repos.reseniaRepository.save).not.toHaveBeenCalled();
  });

  it("informa el 409 antes que el 422 si la compra reseñada no está utilizada", async () => {
    compras = [compraDeAna(CONFIRMADA)];
    resenias = [crearResenia({ compra: compras[0] })];
    await expect(service.crear(7, BODY, usuarioAna)).rejects.toBeInstanceOf(ConflictError);
  });

  it("propaga el 422 del dominio si la compra no está utilizada", async () => {
    compras = [compraDeAna(CONFIRMADA)];
    const promesa = service.crear(7, BODY, usuarioAna);
    await expect(promesa).rejects.toBeInstanceOf(UnprocessableEntityError);
    await expect(promesa).rejects.toThrow("Solo podés reseñar una compra utilizada");
    expect(repos.reseniaRepository.save).not.toHaveBeenCalled();
  });
});

describe("ReseniaService.listarDelOrganizador", () => {
  const PAGINA = { page: 1, limit: 20 };
  const ids = (resultado) => resultado.resenias.map((r) => r.id);
  const reseniaDeFenix = (id, haceDias, puntuacion = 5) =>
    crearResenia({
      id,
      puntuacion,
      fecha: enDias(-haceDias),
      compra: crearCompra({ id, estado: UTILIZADA, evento: eventoDeFenix, comprador: ana }),
    });

  it.each([
    ["inexistente", 999],
    ["que es comprador", ana.id],
  ])("rechaza con 404 un organizador %s", async (_caso, id) => {
    const promesa = service.listarDelOrganizador(id, PAGINA);
    await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
    await expect(promesa).rejects.toThrow(MENSAJE_ORGANIZADOR_INEXISTENTE);
  });

  it("trae el organizador con promedio y cantidad, y las reseñas de la más nueva a la más vieja", async () => {
    resenias = [
      reseniaDeFenix(1, 5, 5),
      reseniaDeFenix(2, 1, 4),
      reseniaDeFenix(3, 5, 4),
      reseniaDeFenix(4, 3, 4),
    ];
    const resultado = await service.listarDelOrganizador(fenix.id, PAGINA);
    expect(resultado.organizador).toEqual({
      id: fenix.id,
      nombre: "Fénix Producciones",
      puntajePromedio: 4.3,
      cantidadResenias: 4,
    });
    expect(ids(resultado)).toEqual([2, 4, 3, 1]);
    expect(resultado).toMatchObject({ total: 4, page: 1, totalPages: 1 });
    expect(resultado.resenias[0]).toEqual({
      id: 2,
      compraId: 2,
      puntuacion: 4,
      detalle: "Muy bueno",
      fecha: enDias(-1).toISOString(),
      evento: { id: 1, nombre: "Rock en el Parque" },
      comprador: { nombre: "Ana Pérez" },
    });
  });

  it("pagina las reseñas, pero el promedio y la cantidad son sobre todas", async () => {
    resenias = [reseniaDeFenix(1, 3, 5), reseniaDeFenix(2, 2, 4), reseniaDeFenix(3, 1, 3)];
    const resultado = await service.listarDelOrganizador(fenix.id, { page: 2, limit: 2 });
    expect(ids(resultado)).toEqual([1]);
    expect(resultado).toMatchObject({ total: 3, page: 2, totalPages: 2 });
    expect(resultado.organizador).toMatchObject({ puntajePromedio: 4, cantidadResenias: 3 });
  });

  it("sin reseñas trae la lista vacía y el promedio null", async () => {
    const resultado = await service.listarDelOrganizador(konex.id, PAGINA);
    expect(resultado).toEqual({
      organizador: {
        id: konex.id,
        nombre: "Konex",
        puntajePromedio: null,
        cantidadResenias: 0,
      },
      resenias: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
  });
});

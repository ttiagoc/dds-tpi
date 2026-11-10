import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { CompraService } from "../../src/services/CompraService.js";
import {
  MENSAJE_COMPRA_INEXISTENTE,
  MENSAJE_EVENTO_INEXISTENTE,
} from "../../src/errors/mensajes.js";
import {
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../src/errors/AppError.js";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";
import { Rol } from "../../src/domain/Rol.js";
import {
  AHORA,
  enDias,
  crearComprador,
  crearOrganizador,
  crearEvento,
  crearCompra,
} from "../helpers/domainFactories.js";

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

const ana = crearComprador();
const bruno = crearComprador({ id: 4, nombre: "Bruno", apellido: "Gómez", email: "b@x.com" });
const fenix = crearOrganizador();
const usuarioAna = { id: ana.id, rol: Rol.COMPRADOR };
const usuarioBruno = { id: bruno.id, rol: Rol.COMPRADOR };
const usuarioFenix = { id: fenix.id, rol: Rol.ORGANIZADOR };
const usuarioKonex = { id: 5, rol: Rol.ORGANIZADOR };

let compras;
let resenias;
let eventos;
let repos;
let service;
let reloj;

function compraDeAnaConEventoEnDias({ id, estado = PENDIENTE, dias = 10, cantidad = 2 }) {
  const evento = crearEvento({ id, nombre: `Evento ${id}`, fecha: enDias(Math.max(dias, 1)) });
  const compra = crearCompra({ id, estado, evento, comprador: ana, cantidad });
  if (dias < 1) evento.fecha = enDias(dias);
  return compra;
}

beforeEach(() => {
  compras = [];
  resenias = [];
  eventos = [crearEvento({ id: 1 }), crearEvento({ id: 2, fecha: enDias(-3) })];
  repos = {
    compraRepository: {
      findById: jest.fn(async (id) => compras.find((c) => c.id === id) ?? null),
      findByComprador: jest.fn(async (id) => compras.filter((c) => c.esDe(id))),
      save: jest.fn(async (compra) => {
        compra.id ??= 99;
        return compra;
      }),
    },
    eventoRepository: {
      findById: jest.fn(async (id) => eventos.find((e) => e.id === id) ?? null),
      save: jest.fn(async (evento) => evento),
    },
    usuarioRepository: {
      findById: jest.fn(async (id) => [ana, bruno, fenix].find((u) => u.id === id) ?? null),
    },
    reseniaRepository: {
      findByCompraId: jest.fn(async (id) => resenias.find((r) => r.compraId === id) ?? null),
      findByComprador: jest.fn(async () => [...resenias]),
    },
  };
  reloj = { ahora: jest.fn(() => AHORA) };
  service = new CompraService({ ...repos, reloj });
});

describe("CompraService.crear", () => {
  const datos = (overrides = {}) => ({ eventoId: 1, tipoEntradaId: 1, cantidad: 2, ...overrides });

  it("crea la compra PENDIENTE del comprador del token, reserva cupo y devuelve el detalle", async () => {
    const detalle = await service.crear(datos(), usuarioAna);
    expect(detalle).toMatchObject({
      id: 99,
      estado: PENDIENTE,
      cantidad: 2,
      total: 90000,
      fechaCompra: AHORA.toISOString(),
      diasRestantes: null,
      evento: { id: 1, nombre: "Los Piojos en River", lugar: "Estadio River Plate", imagen: null },
      tipoEntrada: { id: 1, nombre: "Campo", precio: 45000 },
      comprador: { id: 3, nombre: "Ana Pérez" },
      acciones: {
        puedePagar: true,
        puedeCancelar: true,
        puedeMarcarUtilizada: false,
        puedeReseniar: false,
      },
      historial: [
        {
          estado: PENDIENTE,
          quien: { id: 3, nombre: "Ana Pérez" },
          fechaHora: AHORA.toISOString(),
        },
      ],
      resenia: null,
    });
    expect(eventos[0].tipoEntrada(1).vendidas).toBe(2);
    expect(repos.compraRepository.save).toHaveBeenCalledTimes(1);
    expect(repos.usuarioRepository.findById).toHaveBeenCalledWith(3);
  });

  it("rechaza un evento inexistente con 404 sin guardar", async () => {
    const promesa = service.crear(datos({ eventoId: 999 }), usuarioAna);
    await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
    await expect(promesa).rejects.toThrow(MENSAJE_EVENTO_INEXISTENTE);
    expect(repos.compraRepository.save).not.toHaveBeenCalled();
  });

  it.each([
    ["un tipo inexistente", { tipoEntradaId: 9 }, "No existe el tipo de entrada 9 en este evento"],
    [
      "un evento que ya ocurrió",
      { eventoId: 2 },
      "No podés comprar entradas de un evento que ya ocurrió",
    ],
    ["más entradas que el cupo", { cantidad: 11 }, "No hay cupo suficiente para Campo"],
  ])("propaga el error del dominio con %s sin guardar", async (_caso, overrides, mensaje) => {
    await expect(service.crear(datos(overrides), usuarioAna)).rejects.toThrow(mensaje);
    expect(repos.compraRepository.save).not.toHaveBeenCalled();
  });
});

describe("CompraService.listarDelComprador", () => {
  const PAGINA = { page: 1, limit: 20 };
  const ids = (resultado) => resultado.compras.map((c) => c.id);

  it("ordena primero las próximas por fecha asc y después las pasadas por fecha desc", async () => {
    compras = [
      compraDeAnaConEventoEnDias({ id: 1, dias: 10 }),
      compraDeAnaConEventoEnDias({ id: 2, dias: -5 }),
      compraDeAnaConEventoEnDias({ id: 5, dias: 2 }),
      compraDeAnaConEventoEnDias({ id: 3, dias: -20 }),
      compraDeAnaConEventoEnDias({ id: 4, dias: 2 }),
    ];
    compras[4].evento.fecha = compras[2].evento.fecha;
    const resultado = await service.listarDelComprador(usuarioAna, PAGINA);
    expect(repos.compraRepository.findByComprador).toHaveBeenCalledWith(3);
    expect(ids(resultado)).toEqual([4, 5, 1, 2, 3]);
  });

  it("filtra por estado", async () => {
    compras = [
      compraDeAnaConEventoEnDias({ id: 1, estado: CONFIRMADA }),
      compraDeAnaConEventoEnDias({ id: 2 }),
      compraDeAnaConEventoEnDias({ id: 3, estado: CONFIRMADA }),
    ];
    const resultado = await service.listarDelComprador(usuarioAna, {
      ...PAGINA,
      estado: CONFIRMADA,
    });
    expect(ids(resultado)).toEqual([1, 3]);
    expect(resultado.total).toBe(2);
  });

  it("calcula diasRestantes y acciones, con puedeReseniar false si ya tiene reseña", async () => {
    compras = [
      compraDeAnaConEventoEnDias({ id: 1, estado: CONFIRMADA, dias: 10 }),
      compraDeAnaConEventoEnDias({ id: 2, estado: UTILIZADA, dias: 11 }),
      compraDeAnaConEventoEnDias({ id: 3, estado: UTILIZADA, dias: 12 }),
    ];
    resenias = [{ compraId: 3, puntuacion: 4, detalle: "Bien" }];
    const [confirmada, sinResenia, reseniada] = (
      await service.listarDelComprador(usuarioAna, PAGINA)
    ).compras;
    expect(confirmada).toMatchObject({ diasRestantes: 10, acciones: { puedeCancelar: true } });
    expect(sinResenia).toMatchObject({ diasRestantes: null, acciones: { puedeReseniar: true } });
    expect(reseniada.acciones.puedeReseniar).toBe(false);
    expect(repos.reseniaRepository.findByComprador).toHaveBeenCalledTimes(1);
    expect(repos.reseniaRepository.findByComprador).toHaveBeenCalledWith(3);
  });

  it("pagina con total y totalPages", async () => {
    compras = [1, 2, 3].map((id) => compraDeAnaConEventoEnDias({ id, dias: id }));
    const resultado = await service.listarDelComprador(usuarioAna, { page: 2, limit: 2 });
    expect(resultado).toMatchObject({ total: 3, page: 2, totalPages: 2 });
    expect(ids(resultado)).toEqual([3]);
  });
});

describe("CompraService.obtener", () => {
  beforeEach(() => {
    compras = [compraDeAnaConEventoEnDias({ id: 7, estado: CONFIRMADA })];
  });

  it("devuelve el detalle al comprador con el historial y sin reseña", async () => {
    const detalle = await service.obtener(7, usuarioAna);
    expect(detalle.historial.map((c) => [c.estado, c.quien.nombre])).toEqual([
      [PENDIENTE, "Ana Pérez"],
      [CONFIRMADA, "Ana Pérez"],
    ]);
    expect(detalle.resenia).toBeNull();
  });

  it("el organizador del evento también la ve, con sus acciones", async () => {
    const detalle = await service.obtener(7, usuarioFenix);
    expect(detalle.acciones).toEqual({
      puedePagar: false,
      puedeCancelar: false,
      puedeMarcarUtilizada: true,
      puedeReseniar: false,
    });
  });

  it("incluye la reseña y el nombre del organizador en el historial", async () => {
    compras = [compraDeAnaConEventoEnDias({ id: 7, estado: UTILIZADA })];
    resenias = [{ compraId: 7, puntuacion: 5, detalle: "Genial" }];
    const detalle = await service.obtener(7, usuarioAna);
    expect(detalle.historial.at(-1)).toMatchObject({
      estado: UTILIZADA,
      quien: { id: 2, nombre: "Fénix Producciones" },
    });
    expect(detalle.resenia).toEqual({ puntuacion: 5, detalle: "Genial" });
    expect(detalle.acciones.puedeReseniar).toBe(false);
  });

  it("rechaza una compra inexistente con 404", async () => {
    const promesa = service.obtener(999, usuarioAna);
    await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
    await expect(promesa).rejects.toThrow(MENSAJE_COMPRA_INEXISTENTE);
  });

  it.each([
    ["otro comprador", usuarioBruno],
    ["otro organizador", usuarioKonex],
  ])("rechaza a %s con 403", async (_caso, usuario) => {
    await expect(service.obtener(7, usuario)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("CompraService: una consulta y un instante por request", () => {
  it.each([
    ["obtener", PENDIENTE],
    ["pagar", PENDIENTE],
    ["cancelar", CONFIRMADA],
  ])("%s lee el reloj y la reseña una sola vez", async (metodo, estado) => {
    compras = [compraDeAnaConEventoEnDias({ id: 7, estado })];
    await service[metodo](7, usuarioAna);
    expect(reloj.ahora).toHaveBeenCalledTimes(1);
    expect(repos.reseniaRepository.findByCompraId).toHaveBeenCalledTimes(1);
  });

  it("crear lee el reloj una sola vez", async () => {
    await service.crear({ eventoId: 1, tipoEntradaId: 1, cantidad: 1 }, usuarioAna);
    expect(reloj.ahora).toHaveBeenCalledTimes(1);
  });
});

describe("CompraService guarda el evento cuando cambia el cupo", () => {
  it("crear guarda la compra y el evento con el cupo reservado", async () => {
    await service.crear({ eventoId: 1, tipoEntradaId: 1, cantidad: 2 }, usuarioAna);
    expect(repos.eventoRepository.save).toHaveBeenCalledWith(eventos[0]);
  });

  it.each(["pagar", "cancelar"])("%s guarda la compra y su evento", async (metodo) => {
    compras = [compraDeAnaConEventoEnDias({ id: 7 })];
    await service[metodo](7, usuarioAna);
    expect(repos.compraRepository.save).toHaveBeenCalledWith(compras[0]);
    expect(repos.eventoRepository.save).toHaveBeenCalledWith(compras[0].evento);
  });

  it("si el dominio rechaza la compra no guarda nada", async () => {
    await expect(
      service.crear({ eventoId: 1, tipoEntradaId: 1, cantidad: 11 }, usuarioAna),
    ).rejects.toThrow();
    expect(repos.eventoRepository.save).not.toHaveBeenCalled();
  });
});

describe("CompraService.pagar y cancelar", () => {
  it("pagar confirma la compra, la guarda y devuelve el detalle", async () => {
    compras = [compraDeAnaConEventoEnDias({ id: 7, dias: 12 })];
    const detalle = await service.pagar(7, usuarioAna);
    expect(detalle).toMatchObject({ estado: CONFIRMADA, diasRestantes: 12 });
    expect(detalle.historial.map((c) => c.estado)).toEqual([PENDIENTE, CONFIRMADA]);
    expect(repos.compraRepository.save).toHaveBeenCalledWith(compras[0]);
  });

  it("pagar una compra ya confirmada propaga el 422 de la transición", async () => {
    compras = [compraDeAnaConEventoEnDias({ id: 7, estado: CONFIRMADA })];
    const promesa = service.pagar(7, usuarioAna);
    await expect(promesa).rejects.toBeInstanceOf(UnprocessableEntityError);
    await expect(promesa).rejects.toThrow("No se puede pasar de CONFIRMADA a CONFIRMADA");
    expect(repos.compraRepository.save).not.toHaveBeenCalled();
  });

  it("cancelar una compra CONFIRMADA la reembolsa y libera el cupo", async () => {
    compras = [compraDeAnaConEventoEnDias({ id: 7, estado: CONFIRMADA })];
    const detalle = await service.cancelar(7, usuarioAna);
    expect(detalle.estado).toBe(REEMBOLSADA);
    expect(detalle.historial.map((c) => c.estado)).toEqual([
      PENDIENTE,
      CONFIRMADA,
      CANCELADA,
      REEMBOLSADA,
    ]);
    expect(compras[0].tipoEntrada().vendidas).toBe(0);
    expect(repos.compraRepository.save).toHaveBeenCalledWith(compras[0]);
  });

  it("cancelar una compra PENDIENTE la deja CANCELADA", async () => {
    compras = [compraDeAnaConEventoEnDias({ id: 7 })];
    const detalle = await service.cancelar(7, usuarioAna);
    expect(detalle.estado).toBe(CANCELADA);
    expect(detalle.historial.map((c) => c.estado)).toEqual([PENDIENTE, CANCELADA]);
    expect(compras[0].tipoEntrada().vendidas).toBe(0);
  });

  it("cancelar una compra utilizada propaga el 422 del dominio", async () => {
    compras = [compraDeAnaConEventoEnDias({ id: 7, estado: UTILIZADA })];
    await expect(service.cancelar(7, usuarioAna)).rejects.toThrow(
      "No podés cancelar una compra utilizada",
    );
  });

  it.each(["pagar", "cancelar"])(
    "%s rechaza la compra de otro comprador con 403",
    async (accion) => {
      compras = [compraDeAnaConEventoEnDias({ id: 7 })];
      await expect(service[accion](7, usuarioBruno)).rejects.toBeInstanceOf(ForbiddenError);
      expect(compras[0].estado).toBe(PENDIENTE);
    },
  );

  it.each(["pagar", "cancelar"])("%s rechaza una compra inexistente con 404", async (accion) => {
    await expect(service[accion](999, usuarioAna)).rejects.toThrow(MENSAJE_COMPRA_INEXISTENTE);
  });
});

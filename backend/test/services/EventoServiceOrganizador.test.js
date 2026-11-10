import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { EventoService } from "../../src/services/EventoService.js";
import { MENSAJE_CATEGORIA_INEXISTENTE } from "../../src/errors/mensajes.js";
import { UnprocessableEntityError } from "../../src/errors/AppError.js";
import { Rol } from "../../src/domain/Rol.js";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";
import {
  AHORA,
  enDias,
  crearCategoria,
  crearOrganizador,
  crearEvento,
  crearCompra,
  bodyEvento,
  tipoEntradaBody,
} from "../helpers/domainFactories.js";

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

const fenix = crearOrganizador();
const usuarioFenix = { id: fenix.id, rol: Rol.ORGANIZADOR };
const categoria = crearCategoria({ id: 6, nombre: "Stand-up" });

const datos = bodyEvento;

let eventos;
let compras;
let repos;
let service;

const evento = (id, dias) => crearEvento({ id, nombre: `Evento ${id}`, fecha: enDias(dias) });

beforeEach(() => {
  eventos = [];
  compras = [];
  repos = {
    eventoRepository: {
      save: jest.fn(async (e) => {
        e.id = 50;
        return e;
      }),
      findByOrganizador: jest.fn(async () => [...eventos]),
    },
    categoriaRepository: { findById: jest.fn(async (id) => (id === 6 ? categoria : null)) },
    usuarioRepository: { findById: jest.fn(async (id) => (id === fenix.id ? fenix : null)) },
    reseniaRepository: {
      findByOrganizador: jest.fn(async () => [{ puntuacion: 5 }, { puntuacion: 4 }]),
    },
    compraRepository: { findByOrganizador: jest.fn(async () => [...compras]) },
  };
  service = new EventoService({ ...repos, reloj: { ahora: () => AHORA } });
});

describe("EventoService.crear", () => {
  it("crea el evento del organizador del token y devuelve el detalle", async () => {
    const detalle = await service.crear(datos(), usuarioFenix);
    expect(detalle).toMatchObject({
      id: 50,
      nombre: "Stand-up en el Konex",
      categoria: { id: 6, nombre: "Stand-up" },
      organizador: { id: 2, nombre: "Fénix Producciones", puntajePromedio: 4.5 },
      esFavorito: false,
      precioDesde: 15000,
      imagen: "https://img/standup.jpg",
      tiposEntrada: [
        {
          id: 1,
          nombre: "General",
          descripcion: "De pie",
          precio: 15000,
          cupo: 200,
          disponibles: 200,
        },
        { id: 2, nombre: "VIP", descripcion: "", precio: 30000, cupo: 20, disponibles: 20 },
      ],
    });
    const guardado = repos.eventoRepository.save.mock.calls[0][0];
    expect(guardado.organizador).toBe(fenix);
    expect(guardado.categoria).toBe(categoria);
    expect(repos.usuarioRepository.findById).toHaveBeenCalledWith(2);
  });

  it("rechaza una categoría inexistente con 422 sin guardar", async () => {
    const promesa = service.crear(datos({ categoriaId: 999 }), usuarioFenix);
    await expect(promesa).rejects.toBeInstanceOf(UnprocessableEntityError);
    await expect(promesa).rejects.toThrow(MENSAJE_CATEGORIA_INEXISTENTE);
    expect(MENSAJE_CATEGORIA_INEXISTENTE).toBe("La categoría no existe");
    expect(repos.eventoRepository.save).not.toHaveBeenCalled();
  });

  it("propaga los errores del dominio sin guardar", async () => {
    const promesa = service.crear(
      datos({ tiposEntrada: [tipoEntradaBody({ precio: -1 })] }),
      usuarioFenix,
    );
    await expect(promesa).rejects.toThrow("El precio no puede ser negativo");
    expect(repos.eventoRepository.save).not.toHaveBeenCalled();
  });

  it("usa el reloj para exigir una fecha futura", async () => {
    service = new EventoService({ ...repos, reloj: { ahora: () => enDias(30) } });
    await expect(service.crear(datos(), usuarioFenix)).rejects.toThrow(
      "La fecha del evento tiene que ser futura",
    );
  });
});

describe("EventoService.listarDelOrganizador", () => {
  const PAGINA = { page: 1, limit: 20 };
  const ids = (resultado) => resultado.eventos.map((e) => e.id);

  it("trae todos los eventos del organizador, incluidos los pasados, por fecha y id", async () => {
    eventos = [evento(3, 10), evento(1, -5), evento(4, 10), evento(2, 2)];
    const resultado = await service.listarDelOrganizador(usuarioFenix, PAGINA);
    expect(repos.eventoRepository.findByOrganizador).toHaveBeenCalledWith(2);
    expect(ids(resultado)).toEqual([1, 2, 3, 4]);
  });

  it("agrega vendidas, cupo y recaudado a cada resumen", async () => {
    const conVentas = evento(1, 10);
    const sinVentas = evento(2, 12);
    eventos = [conVentas, sinVentas];
    compras = [PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA].map((estado, i) =>
      crearCompra({ id: i + 1, estado, evento: conVentas, cantidad: 1 }),
    );
    const [primero, segundo] = (await service.listarDelOrganizador(usuarioFenix, PAGINA)).eventos;
    expect(primero).toMatchObject({
      id: 1,
      vendidas: 3,
      cupo: 15,
      recaudado: 90000,
      organizador: { puntajePromedio: 4.5 },
      esFavorito: false,
    });
    expect(segundo).toMatchObject({ id: 2, vendidas: 0, cupo: 15, recaudado: 0 });
  });

  it("pide las compras y las reseñas una sola vez por request", async () => {
    eventos = [evento(1, 10), evento(2, 12), evento(3, 14)];
    await service.listarDelOrganizador(usuarioFenix, PAGINA);
    expect(repos.compraRepository.findByOrganizador).toHaveBeenCalledTimes(1);
    expect(repos.compraRepository.findByOrganizador).toHaveBeenCalledWith(2);
    expect(repos.reseniaRepository.findByOrganizador).toHaveBeenCalledTimes(1);
  });

  it("pagina con total y totalPages", async () => {
    eventos = [evento(1, 1), evento(2, 2), evento(3, 3)];
    const resultado = await service.listarDelOrganizador(usuarioFenix, { page: 2, limit: 2 });
    expect(resultado).toMatchObject({ total: 3, page: 2, totalPages: 2 });
    expect(ids(resultado)).toEqual([3]);
  });
});

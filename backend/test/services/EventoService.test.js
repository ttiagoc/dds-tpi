import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { EventoService } from "../../src/services/EventoService.js";
import { MENSAJE_EVENTO_INEXISTENTE } from "../../src/errors/mensajes.js";
import { NotFoundError } from "../../src/errors/AppError.js";
import { Rol } from "../../src/domain/Rol.js";
import {
  AHORA,
  enDias,
  crearComprador,
  crearOrganizador,
  crearEvento,
} from "../helpers/domainFactories.js";

const fenix = crearOrganizador();
const konex = crearOrganizador({ id: 5, nombre: "Konex", email: "konex@aiticket.com" });
const nuevo = crearOrganizador({ id: 6, nombre: "Nuevo", email: "nuevo@aiticket.com" });

const tipo = (precio) => [{ nombre: "General", precio, cupo: 10 }];
const evento = (id, organizador, dias, precio) =>
  crearEvento({
    id,
    nombre: `Evento ${id}`,
    organizador,
    fecha: enDias(dias),
    tiposEntrada: tipo(precio),
  });

const resenia = (organizador, puntuacion) => ({ puntuacion, evento: { organizador } });
const RESENIAS = [resenia(fenix, 5), resenia(fenix, 4), resenia(konex, 3)];

const QUERY = { ordenarPor: "fecha", orden: "asc", page: 1, limit: 20 };

let eventos;
let ana;
let repos;
let service;

const ids = (resultado) => resultado.eventos.map((e) => e.id);
const buscar = (query = {}, usuario) => service.buscar({ ...QUERY, ...query }, usuario);

beforeEach(() => {
  eventos = [evento(1, fenix, 10, 30000), evento(2, konex, 5, 10000), evento(3, nuevo, 20, 20000)];
  ana = crearComprador({ favoritos: [2] });
  repos = {
    eventoRepository: {
      buscar: jest.fn(async () => [...eventos]),
      findById: jest.fn(async (id) => eventos.find((e) => e.id === id) ?? null),
    },
    reseniaRepository: {
      findAll: jest.fn(async () => RESENIAS),
      findByOrganizador: jest.fn(async (id) =>
        RESENIAS.filter((r) => r.evento.organizador.id === id),
      ),
    },
    usuarioRepository: { findById: jest.fn(async (id) => (id === ana.id ? ana : null)) },
  };
  service = new EventoService({ ...repos, reloj: { ahora: () => AHORA } });
});

describe("EventoService.buscar", () => {
  it("pasa los filtros y el momento actual al repo", async () => {
    await buscar({ q: "rock", incluirPasados: true });
    expect(repos.eventoRepository.buscar).toHaveBeenCalledWith(
      expect.objectContaining({ q: "rock", incluirPasados: true }),
      AHORA,
    );
  });

  it("ordena por fecha asc por defecto y desc si se pide", async () => {
    expect(ids(await buscar())).toEqual([2, 1, 3]);
    expect(ids(await buscar({ orden: "desc" }))).toEqual([3, 1, 2]);
  });

  it("ordena por precio mínimo", async () => {
    expect(ids(await buscar({ ordenarPor: "precio" }))).toEqual([2, 3, 1]);
    expect(ids(await buscar({ ordenarPor: "precio", orden: "desc" }))).toEqual([1, 3, 2]);
  });

  it("ordena por puntaje con los organizadores sin reseñas al final en los dos órdenes", async () => {
    expect(ids(await buscar({ ordenarPor: "puntaje", orden: "desc" }))).toEqual([1, 2, 3]);
    expect(ids(await buscar({ ordenarPor: "puntaje", orden: "asc" }))).toEqual([2, 1, 3]);
  });

  it("desempata por fecha asc y después por id asc", async () => {
    eventos = [evento(9, fenix, 10, 100), evento(4, fenix, 10, 100), evento(7, fenix, 2, 100)];
    expect(ids(await buscar({ ordenarPor: "precio", orden: "desc" }))).toEqual([7, 4, 9]);
    expect(ids(await buscar({ ordenarPor: "puntaje" }))).toEqual([7, 4, 9]);
  });

  it("pagina y calcula total y totalPages", async () => {
    const resultado = await buscar({ page: 2, limit: 2 });
    expect(resultado).toMatchObject({ total: 3, page: 2, totalPages: 2 });
    expect(ids(resultado)).toEqual([3]);
  });

  it("pide las reseñas una sola vez por request", async () => {
    await buscar({ ordenarPor: "puntaje" });
    expect(repos.reseniaRepository.findAll).toHaveBeenCalledTimes(1);
    expect(repos.reseniaRepository.findByOrganizador).not.toHaveBeenCalled();
  });

  it("arma el puntaje promedio de cada organizador", async () => {
    const puntajes = (await buscar()).eventos.map((e) => e.organizador.puntajePromedio);
    expect(puntajes).toEqual([3, 4.5, null]);
  });

  it("marca esFavorito solo para los favoritos del comprador con sesión", async () => {
    const resultado = await buscar({}, { id: ana.id, rol: Rol.COMPRADOR });
    expect(resultado.eventos.map((e) => [e.id, e.esFavorito])).toEqual([
      [2, true],
      [1, false],
      [3, false],
    ]);
  });

  it.each([
    ["anónimo", undefined],
    ["organizador", { id: 2, rol: Rol.ORGANIZADOR }],
  ])("con un usuario %s esFavorito es false y no busca al usuario", async (_caso, usuario) => {
    const resultado = await buscar({}, usuario);
    expect(resultado.eventos.every((e) => e.esFavorito === false)).toBe(true);
    expect(repos.usuarioRepository.findById).not.toHaveBeenCalled();
  });

  it("si el comprador del token ya no existe, esFavorito es false", async () => {
    const resultado = await buscar({}, { id: 99, rol: Rol.COMPRADOR });
    expect(resultado.eventos.every((e) => e.esFavorito === false)).toBe(true);
  });
});

describe("EventoService.obtener", () => {
  it("devuelve el detalle de un evento pasado con disponibles y puntaje", async () => {
    const pasado = crearEvento({ id: 10, fecha: enDias(-5) });
    pasado.tiposEntrada[0].vendidas = 4;
    eventos = [pasado];
    const detalle = await service.obtener(10, { id: ana.id, rol: Rol.COMPRADOR });
    expect(detalle).toMatchObject({
      id: 10,
      descripcion: "Vuelven los Piojos",
      organizador: { id: 2, nombre: "Fénix Producciones", puntajePromedio: 4.5 },
      esFavorito: false,
      tiposEntrada: [
        { id: 1, nombre: "Campo", descripcion: "", precio: 45000, cupo: 10, disponibles: 6 },
        { id: 2, nombre: "Platea", descripcion: "", precio: 80000, cupo: 5, disponibles: 5 },
      ],
    });
    expect(repos.reseniaRepository.findByOrganizador).toHaveBeenCalledWith(2);
  });

  it("marca esFavorito en el detalle", async () => {
    const detalle = await service.obtener(2, { id: ana.id, rol: Rol.COMPRADOR });
    expect(detalle.esFavorito).toBe(true);
  });

  it("rechaza un evento inexistente con 404", async () => {
    const promesa = service.obtener(999);
    await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
    await expect(promesa).rejects.toThrow(MENSAJE_EVENTO_INEXISTENTE);
  });
});

describe("EventoService.toResumen y toDetalle", () => {
  it("toResumen arma el EventoResumen del contrato", () => {
    const e = crearEvento({ multimedia: ["https://img/1", "https://img/2"] });
    expect(service.toResumen(e, { puntajePromedio: 4.5, esFavorito: true })).toEqual({
      id: 1,
      nombre: "Los Piojos en River",
      fecha: e.fecha.toISOString(),
      lugar: "Estadio River Plate",
      categoria: { id: 1, nombre: "Recitales" },
      precioDesde: 45000,
      imagen: "https://img/1",
      organizador: { id: 2, nombre: "Fénix Producciones", puntajePromedio: 4.5 },
      esFavorito: true,
    });
  });

  it("toResumen usa imagen null si no hay multimedia", () => {
    const resumen = service.toResumen(crearEvento(), { puntajePromedio: null, esFavorito: false });
    expect(resumen.imagen).toBeNull();
  });

  it("toDetalle agrega descripcion, multimedia y tiposEntrada", () => {
    const detalle = service.toDetalle(crearEvento({ multimedia: ["https://img/1"] }), {
      puntajePromedio: null,
      esFavorito: false,
    });
    expect(detalle).toMatchObject({
      descripcion: "Vuelven los Piojos",
      multimedia: ["https://img/1"],
    });
    expect(detalle.tiposEntrada).toHaveLength(2);
  });
});

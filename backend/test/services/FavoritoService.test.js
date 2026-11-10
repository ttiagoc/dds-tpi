import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { FavoritoService } from "../../src/services/FavoritoService.js";
import { MENSAJE_EVENTO_INEXISTENTE } from "../../src/errors/mensajes.js";
import { NotFoundError } from "../../src/errors/AppError.js";
import { Rol } from "../../src/domain/Rol.js";
import { enDias, crearComprador, crearEvento } from "../helpers/domainFactories.js";

const evento = (id, dias) => crearEvento({ id, nombre: `Evento ${id}`, fecha: enDias(dias) });

let ana;
let usuarioAna;
let eventos;
let repos;
let eventoService;
let service;

beforeEach(() => {
  eventos = [evento(1, 20), evento(2, -30), evento(3, 5), evento(4, 5)];
  ana = crearComprador({ favoritos: [1, 4, 2, 3] });
  usuarioAna = { id: ana.id, rol: Rol.COMPRADOR };
  repos = {
    usuarioRepository: {
      findById: jest.fn(async (id) => (id === ana.id ? ana : null)),
      save: jest.fn(async (usuario) => usuario),
    },
    eventoRepository: {
      findById: jest.fn(async (id) => eventos.find((e) => e.id === id) ?? null),
    },
  };
  eventoService = {
    resumenes: jest.fn(async (lista) => lista.map((e) => ({ id: e.id, esFavorito: true }))),
  };
  service = new FavoritoService({ ...repos, eventoService });
});

describe("FavoritoService.listar", () => {
  it("arma los resúmenes de los favoritos, pasados incluidos, por fecha asc e id asc", async () => {
    const resultado = await service.listar(usuarioAna);
    const [lista, usuario] = eventoService.resumenes.mock.calls[0];
    expect(lista.map((e) => e.id)).toEqual([2, 3, 4, 1]);
    expect(usuario).toBe(usuarioAna);
    expect(resultado.map((e) => e.id)).toEqual([2, 3, 4, 1]);
  });

  it("sin favoritos devuelve la lista vacía", async () => {
    ana.favoritos = [];
    expect(await service.listar(usuarioAna)).toEqual([]);
  });
});

describe("FavoritoService.agregar", () => {
  it("agrega el evento y guarda al usuario", async () => {
    ana.favoritos = [];
    await service.agregar(3, usuarioAna);
    expect(ana.favoritos).toEqual([3]);
    expect(repos.usuarioRepository.save).toHaveBeenCalledWith(ana);
  });

  it("es idempotente y admite un evento pasado", async () => {
    await service.agregar(2, usuarioAna);
    await service.agregar(2, usuarioAna);
    expect(ana.favoritos.filter((id) => id === 2)).toHaveLength(1);
  });

  it("rechaza un evento inexistente con 404 sin guardar", async () => {
    const promesa = service.agregar(99, usuarioAna);
    await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
    await expect(promesa).rejects.toThrow(MENSAJE_EVENTO_INEXISTENTE);
    expect(repos.usuarioRepository.save).not.toHaveBeenCalled();
  });
});

describe("FavoritoService.quitar", () => {
  it("quita el evento y guarda al usuario", async () => {
    await service.quitar(4, usuarioAna);
    expect(ana.favoritos).toEqual([1, 2, 3]);
    expect(repos.usuarioRepository.save).toHaveBeenCalledWith(ana);
  });

  it("es idempotente y no valida que el evento exista", async () => {
    await service.quitar(99, usuarioAna);
    expect(ana.favoritos).toEqual([1, 4, 2, 3]);
    expect(repos.eventoRepository.findById).not.toHaveBeenCalled();
  });
});

import { describe, it, expect } from "@jest/globals";
import { UsuarioRepository } from "../../src/repositories/UsuarioRepository.js";
import { EventoRepository } from "../../src/repositories/EventoRepository.js";
import { CompraRepository } from "../../src/repositories/CompraRepository.js";
import { ReseniaRepository } from "../../src/repositories/ReseniaRepository.js";
import { CategoriaRepository } from "../../src/repositories/CategoriaRepository.js";
import { InMemoryRepository } from "../../src/repositories/InMemoryRepository.js";
import { Resenia } from "../../src/domain/Resenia.js";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";
import {
  AHORA,
  crearComprador,
  crearOrganizador,
  crearEvento,
  crearCompra,
} from "../helpers/domainFactories.js";

describe("repositorios", () => {
  it("todos extienden InMemoryRepository", () => {
    for (const Repo of [
      UsuarioRepository,
      CategoriaRepository,
      EventoRepository,
      CompraRepository,
      ReseniaRepository,
    ]) {
      expect(new Repo()).toBeInstanceOf(InMemoryRepository);
    }
  });

  it("UsuarioRepository busca por email sin distinguir mayúsculas", async () => {
    const repo = new UsuarioRepository();
    const ana = await repo.save(crearComprador({ id: null }));
    expect(await repo.findByEmail("ANA@aiticket.com")).toBe(ana);
    expect(await repo.findByEmail("nadie@aiticket.com")).toBeNull();
    expect(await repo.findByEmail(undefined)).toBeNull();
  });

  it("EventoRepository busca por organizador", async () => {
    const repo = new EventoRepository();
    const deFenix = await repo.save(crearEvento({ id: null }));
    await repo.save(crearEvento({ id: null, organizador: crearOrganizador({ id: 9 }) }));
    expect(await repo.findByOrganizador(2)).toEqual([deFenix]);
  });

  it("CompraRepository busca por comprador y por evento", async () => {
    const repo = new CompraRepository();
    const evento = crearEvento();
    const otroEvento = crearEvento({ id: 2 });
    const deAna = await repo.save(crearCompra({ id: null, evento }));
    const deBruno = await repo.save(
      crearCompra({
        id: null,
        evento: otroEvento,
        comprador: crearComprador({ id: 4, email: "bruno@aiticket.com" }),
      }),
    );
    expect(await repo.findByComprador(3)).toEqual([deAna]);
    expect(await repo.findByEvento(2)).toEqual([deBruno]);
  });

  it("las búsquedas por id aceptan el id como string, igual que findById", async () => {
    const eventos = new EventoRepository();
    const evento = await eventos.save(crearEvento({ id: null }));
    expect(await eventos.findByOrganizador("2")).toEqual([evento]);

    const compras = new CompraRepository();
    const compra = await compras.save(crearCompra({ id: null }));
    expect(await compras.findByComprador("3")).toEqual([compra]);
    expect(await compras.findByEvento("1")).toEqual([compra]);

    const resenias = new ReseniaRepository();
    const utilizada = crearCompra({ estado: EstadoCompra.UTILIZADA, id: 7 });
    const resenia = await resenias.save(
      Resenia.crear({ compra: utilizada, puntuacion: 5, detalle: "Bien" }, AHORA),
    );
    expect(await resenias.findByCompraId("7")).toBe(resenia);
    expect(await resenias.findByEvento("1")).toEqual([resenia]);
    expect(await resenias.findByOrganizador("2")).toEqual([resenia]);
  });

  it("ReseniaRepository busca por compra, evento y organizador", async () => {
    const repo = new ReseniaRepository();
    const compra = crearCompra({ estado: EstadoCompra.UTILIZADA, id: 7 });
    const resenia = await repo.save(
      Resenia.crear({ compra, puntuacion: 5, detalle: "Bien" }, AHORA),
    );
    expect(await repo.findByCompraId(7)).toBe(resenia);
    expect(await repo.findByCompraId(8)).toBeNull();
    expect(await repo.findByEvento(1)).toEqual([resenia]);
    expect(await repo.findByOrganizador(2)).toEqual([resenia]);
    expect(await repo.findByOrganizador(3)).toEqual([]);
  });
});

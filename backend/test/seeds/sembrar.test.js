import { describe, it, expect, beforeAll } from "@jest/globals";
import bcrypt from "bcryptjs";
import { crearContenedor } from "../../src/contenedor.js";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";
import { Resenia } from "../../src/domain/Resenia.js";
import { CONTRASENIA_DEMO } from "../../src/seeds/sembrar.js";
import { AHORA, DIA } from "../helpers/domainFactories.js";

const OCUPAN_CUPO = [EstadoCompra.PENDIENTE, EstadoCompra.CONFIRMADA, EstadoCompra.UTILIZADA];

describe("sembrar", () => {
  let repos;
  let todo;

  beforeAll(async () => {
    const contenedor = crearContenedor({ reloj: { ahora: () => AHORA } });
    await contenedor.resetear();
    repos = contenedor.repos;
    todo = {
      usuarios: await repos.usuarioRepository.findAll(),
      categorias: await repos.categoriaRepository.findAll(),
      eventos: await repos.eventoRepository.findAll(),
      compras: await repos.compraRepository.findAll(),
      resenias: await repos.reseniaRepository.findAll(),
    };
  });

  const usuario = (email) => todo.usuarios.find((u) => u.email === email);

  it("carga 4 usuarios, 15 categorías y 12 eventos", () => {
    expect(todo.usuarios.map((u) => u.email).sort()).toEqual([
      "ana@aiticket.com",
      "bruno@aiticket.com",
      "fenix@aiticket.com",
      "konex@aiticket.com",
    ]);
    expect(todo.categorias.map((c) => c.nombre)).toEqual([
      "Recitales",
      "Teatro",
      "Festivales",
      "Conferencias",
      "Deportes",
      "Stand-up",
      "Danza",
      "Cine",
      "Infantiles",
      "Ferias",
      "Exposiciones",
      "Gastronomía",
      "Electrónica",
      "Jazz",
      "Tango",
    ]);
    expect(todo.eventos).toHaveLength(12);
  });

  it("todas las contraseñas son Demo1234!", async () => {
    expect(CONTRASENIA_DEMO).toBe("Demo1234!");
    for (const u of todo.usuarios) {
      expect(await bcrypt.compare(CONTRASENIA_DEMO, u.passwordHash)).toBe(true);
    }
  });

  it("los organizadores no tienen apellido y los compradores sí", () => {
    expect(usuario("fenix@aiticket.com").nombreCompleto()).toBe("Fénix Producciones");
    expect(usuario("ana@aiticket.com").nombreCompleto()).toBe("Ana Pérez");
  });

  it("tiene 9 eventos futuros y 3 pasados respecto de ahora", () => {
    const pasados = todo.eventos.filter((e) => e.yaOcurrio(AHORA));
    expect(pasados).toHaveLength(3);
    const organizadoresConPasados = new Set(pasados.map((e) => e.organizador.email));
    expect(organizadoresConPasados.size).toBe(2);
  });

  it("cada una de las 6 primeras categorías tiene al menos un evento", () => {
    for (const categoria of todo.categorias.slice(0, 6)) {
      expect(todo.eventos.some((e) => e.categoria === categoria)).toBe(true);
    }
  });

  it("hay un evento a menos de un día", () => {
    const proximos = todo.eventos.filter(
      (e) => !e.yaOcurrio(AHORA) && e.fecha.getTime() - AHORA.getTime() < DIA,
    );
    expect(proximos).toHaveLength(1);
  });

  it("hay un VIP casi agotado: 18 de 20", () => {
    const vips = todo.eventos.flatMap((e) => e.tiposEntrada).filter((t) => t.nombre === "VIP");
    expect(vips.map((t) => [t.vendidas, t.cupo])).toContainEqual([18, 20]);
  });

  it("Ana tiene compras en los cinco estados", () => {
    const ana = usuario("ana@aiticket.com");
    const estados = new Set(todo.compras.filter((c) => c.esDe(ana.id)).map((c) => c.estado));
    expect([...estados].sort()).toEqual(Object.values(EstadoCompra).sort());
  });

  it("Ana tiene una UTILIZADA sin reseña para poder reseñar", () => {
    const ana = usuario("ana@aiticket.com");
    const sinResenia = todo.compras.filter(
      (c) =>
        c.esDe(ana.id) &&
        c.estado === EstadoCompra.UTILIZADA &&
        !todo.resenias.some((r) => r.compraId === c.id),
    );
    expect(sinResenia.length).toBeGreaterThanOrEqual(1);
  });

  it("Ana tiene una CONFIRMADA al evento de menos de un día, con 1 día restante", () => {
    const ana = usuario("ana@aiticket.com");
    const dias = todo.compras.filter((c) => c.esDe(ana.id)).map((c) => c.diasRestantes(AHORA));
    expect(dias).toContain(1);
  });

  it("las vendidas de cada tipo salen de las compras que ocupan cupo", () => {
    for (const evento of todo.eventos) {
      for (const tipo of evento.tiposEntrada) {
        const esperadas = todo.compras
          .filter(
            (c) =>
              c.evento === evento && c.tipoEntrada() === tipo && OCUPAN_CUPO.includes(c.estado),
          )
          .reduce((total, c) => total + c.cantidad, 0);
        expect(tipo.vendidas).toBe(esperadas);
      }
    }
  });

  it("el historial de cada compra respeta las transiciones y el orden temporal", () => {
    for (const compra of todo.compras) {
      expect(compra.historial[0].estado).toBe(EstadoCompra.PENDIENTE);
      expect(compra.historial.at(-1).estado).toBe(compra.estado);
      const tiempos = compra.historial.map((c) => c.fechaHora.getTime());
      expect([...tiempos].sort((a, b) => a - b)).toEqual(tiempos);
      expect(tiempos.at(-1)).toBeLessThanOrEqual(AHORA.getTime());
    }
  });

  it("cada compra tiene una entrada por unidad, usadas solo si está UTILIZADA", () => {
    for (const compra of todo.compras) {
      const usada = compra.estado === EstadoCompra.UTILIZADA;
      expect(compra.entradas).toHaveLength(compra.cantidad);
      expect(compra.entradas.every((e) => e.estaUsada() === usada)).toBe(true);
    }
  });

  it("cada compra usa la misma instancia de evento que el repo", () => {
    for (const compra of todo.compras) {
      expect(todo.eventos).toContain(compra.evento);
    }
  });

  it("las reseñas son solo de compras UTILIZADA y una por compra", () => {
    const ids = todo.resenias.map((r) => r.compraId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const resenia of todo.resenias) {
      const compra = todo.compras.find((c) => c.id === resenia.compraId);
      expect(compra.estado).toBe(EstadoCompra.UTILIZADA);
      expect(resenia.evento).toBe(compra.evento);
    }
  });

  it("Fénix y Konex tienen puntaje y es distinto", async () => {
    const fenix = usuario("fenix@aiticket.com");
    const konex = usuario("konex@aiticket.com");
    const puntajeFenix = Resenia.promedio(
      await repos.reseniaRepository.findByOrganizador(fenix.id),
    );
    const puntajeKonex = Resenia.promedio(
      await repos.reseniaRepository.findByOrganizador(konex.id),
    );
    expect(puntajeFenix).not.toBeNull();
    expect(puntajeKonex).not.toBeNull();
    expect(puntajeFenix).not.toBe(puntajeKonex);
  });

  it("la compra CONFIRMADA con chat tiene un mensaje de Ana y uno del organizador", () => {
    const conChat = todo.compras.filter((c) => c.mensajes.length > 0);
    expect(conChat).toHaveLength(1);
    const [compra] = conChat;
    expect(compra.estado).toBe(EstadoCompra.CONFIRMADA);
    expect(compra.mensajes.map((m) => m.usuario.rol)).toEqual(["COMPRADOR", "ORGANIZADOR"]);
  });

  it("Ana tiene 2 favoritos que existen", () => {
    const ana = usuario("ana@aiticket.com");
    expect(ana.favoritos).toHaveLength(2);
    for (const id of ana.favoritos) {
      expect(todo.eventos.some((e) => e.id === id)).toBe(true);
    }
  });
});

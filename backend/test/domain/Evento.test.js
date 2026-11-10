import { describe, it, expect } from "@jest/globals";
import { Evento } from "../../src/domain/Evento.js";
import { TipoEntrada } from "../../src/domain/TipoEntrada.js";
import { NotFoundError, UnprocessableEntityError } from "../../src/errors/AppError.js";
import {
  AHORA,
  enDias,
  crearComprador,
  crearEvento,
  datosEvento,
} from "../helpers/domainFactories.js";

describe("Evento", () => {
  describe("constructor", () => {
    it("convierte los tipos de entrada a instancias de TipoEntrada", () => {
      const evento = crearEvento();
      expect(evento.tiposEntrada[0]).toBeInstanceOf(TipoEntrada);
      expect(evento.multimedia).toEqual([]);
    });

    it("acepta la fecha como string ISO", () => {
      const evento = crearEvento({ fecha: "2026-12-20T23:00:00.000Z" });
      expect(evento.fecha).toEqual(new Date("2026-12-20T23:00:00.000Z"));
    });

    it("asigna ids a los tipos que no tienen, después del mayor existente", () => {
      const evento = crearEvento({
        tiposEntrada: [
          { nombre: "General", precio: 1, cupo: 1 },
          { id: 4, nombre: "VIP", precio: 2, cupo: 1 },
          { nombre: "Platea", precio: 3, cupo: 1 },
        ],
      });
      expect(evento.tiposEntrada.map((t) => t.id)).toEqual([5, 4, 6]);
    });

    it("permite rehidratar un evento pasado", () => {
      expect(() => crearEvento({ fecha: enDias(-30) })).not.toThrow();
    });

    it.each([
      [{ nombre: "AB" }, "El nombre del evento tiene que tener entre 3 y 100 caracteres"],
      [
        { nombre: "x".repeat(101) },
        "El nombre del evento tiene que tener entre 3 y 100 caracteres",
      ],
      [{ descripcion: "" }, "El evento necesita una descripción"],
      [{ categoria: null }, "El evento necesita una categoría"],
      [{ fecha: "no es fecha" }, "La fecha del evento no es válida"],
      [{ fecha: undefined }, "La fecha del evento no es válida"],
      [{ lugar: " " }, "El evento necesita un lugar"],
      [{ tiposEntrada: [] }, "El evento necesita al menos un tipo de entrada"],
      [{ tiposEntrada: undefined }, "El evento necesita al menos un tipo de entrada"],
      [
        { organizador: crearComprador() },
        "El organizador del evento tiene que tener rol ORGANIZADOR",
      ],
      [{ organizador: undefined }, "El organizador del evento tiene que tener rol ORGANIZADOR"],
    ])("rechaza %p", (cambio, mensaje) => {
      expect(() => crearEvento(cambio)).toThrow(UnprocessableEntityError);
      expect(() => crearEvento(cambio)).toThrow(mensaje);
    });

    it("conserva las instancias de TipoEntrada recibidas", () => {
      const tipo = new TipoEntrada({ id: 1, nombre: "Campo", precio: 1, cupo: 1 });
      expect(crearEvento({ tiposEntrada: [tipo] }).tipoEntrada(1)).toBe(tipo);
    });

    it("rechaza tipos de entrada con el id repetido", () => {
      const tiposEntrada = [
        { id: 1, nombre: "Campo", precio: 1, cupo: 1 },
        { id: 1, nombre: "Platea", precio: 2, cupo: 1 },
      ];
      expect(() => crearEvento({ tiposEntrada })).toThrow(
        "Hay tipos de entrada con el id repetido",
      );
    });

    it("toma multimedia null como lista vacía", () => {
      expect(crearEvento({ multimedia: null }).multimedia).toEqual([]);
    });

    it.each([[[123]], [[""]], ["https://x"]])("rechaza multimedia %p", (multimedia) => {
      expect(() => crearEvento({ multimedia })).toThrow(
        "Las imágenes del evento tienen que ser URLs",
      );
    });

    it("rechaza nombres de tipo repetidos sin distinguir mayúsculas", () => {
      const tiposEntrada = [
        { nombre: "VIP", precio: 1, cupo: 1 },
        { nombre: " vip ", precio: 2, cupo: 1 },
      ];
      expect(() => crearEvento({ tiposEntrada })).toThrow("Ya hay un tipo de entrada llamado vip");
    });

    it("rechaza nombres de tipo repetidos sin distinguir acentos", () => {
      const tiposEntrada = [
        { nombre: "Platea", precio: 1, cupo: 1 },
        { nombre: "Pláteá", precio: 2, cupo: 1 },
      ];
      expect(() => crearEvento({ tiposEntrada })).toThrow(
        "Ya hay un tipo de entrada llamado Pláteá",
      );
    });
  });

  describe("crear", () => {
    it("crea un evento con fecha futura", () => {
      const evento = Evento.crear(datosEvento({ id: null }), AHORA);
      expect(evento).toBeInstanceOf(Evento);
    });

    it.each([enDias(-1), AHORA])("rechaza la fecha %p por no ser futura", (fecha) => {
      expect(() => Evento.crear(datosEvento({ fecha }), AHORA)).toThrow(
        "La fecha del evento tiene que ser futura",
      );
    });

    it("rechaza un evento nuevo con entradas vendidas", () => {
      const tiposEntrada = [{ nombre: "Campo", precio: 1, cupo: 5, vendidas: 1 }];
      expect(() => Evento.crear(datosEvento({ tiposEntrada }), AHORA)).toThrow(
        "Un evento nuevo no puede tener entradas vendidas",
      );
    });

    it("también aplica las validaciones del constructor", () => {
      expect(() => Evento.crear(datosEvento({ lugar: "" }), AHORA)).toThrow(
        "El evento necesita un lugar",
      );
    });
  });

  describe("tipoEntrada", () => {
    it("devuelve el tipo por id", () => {
      expect(crearEvento().tipoEntrada(2).nombre).toBe("Platea");
    });

    it("tira NotFoundError si no existe", () => {
      expect(() => crearEvento().tipoEntrada(99)).toThrow(NotFoundError);
      expect(() => crearEvento().tipoEntrada(99)).toThrow(
        "No existe el tipo de entrada 99 en este evento",
      );
    });
  });

  describe("consultas", () => {
    it("yaOcurrio es true desde la fecha del evento", () => {
      const evento = crearEvento({ fecha: AHORA });
      expect(evento.yaOcurrio(new Date(AHORA.getTime() - 1))).toBe(false);
      expect(evento.yaOcurrio(AHORA)).toBe(true);
    });

    it("esDe compara con el organizador", () => {
      expect(crearEvento().esDe(2)).toBe(true);
      expect(crearEvento().esDe(3)).toBe(false);
    });

    it("precioMinimo devuelve el menor precio", () => {
      expect(crearEvento().precioMinimo()).toBe(45000);
    });

    it.each([
      [50000, 90000, true],
      [90000, undefined, false],
      [undefined, 40000, false],
      [undefined, undefined, true],
      [45000, 45000, true],
    ])("tuPrecioEstaEntre(%p, %p) es %p", (min, max, esperado) => {
      expect(crearEvento().tuPrecioEstaEntre(min, max)).toBe(esperado);
    });

    it.each([
      ["piojos", true],
      ["RIVER", true],
      ["vuelven", true],
      ["teatro", false],
      ["", true],
    ])("coincideCon(%p) es %p", (texto, esperado) => {
      expect(crearEvento().coincideCon(texto)).toBe(esperado);
    });

    it("coincideCon sin texto coincide con todo", () => {
      expect(crearEvento().coincideCon(undefined)).toBe(true);
    });

    it("coincideCon ignora acentos en ambos lados", () => {
      const evento = crearEvento({ nombre: "Gran Teátro Colón" });
      expect(evento.coincideCon("teatro colon")).toBe(true);
      expect(crearEvento({ nombre: "Teatro Colon" }).coincideCon("Teátro")).toBe(true);
    });

    it("totalVendidas suma todos los tipos", () => {
      const evento = crearEvento();
      evento.tipoEntrada(1).reservar(3);
      evento.tipoEntrada(2).reservar(2);
      expect(evento.totalVendidas()).toBe(5);
    });

    it("cupoTotal suma los cupos de todos los tipos sin importar lo vendido", () => {
      const evento = crearEvento();
      evento.tipoEntrada(1).reservar(3);
      expect(evento.cupoTotal()).toBe(15);
    });
  });
});

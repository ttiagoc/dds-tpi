import { describe, it, expect } from "@jest/globals";
import { Compra } from "../../src/domain/Compra.js";
import { EstadoCompra, TRANSICIONES } from "../../src/domain/EstadoCompra.js";
import { Rol } from "../../src/domain/Rol.js";
import { NotFoundError, UnprocessableEntityError } from "../../src/errors/AppError.js";
import {
  AHORA,
  DIA,
  enDias,
  crearComprador,
  crearOrganizador,
  crearEvento,
  crearCompra,
} from "../helpers/domainFactories.js";

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;
const COMPRADOR_ID = 3;
const ORGANIZADOR_ID = 2;

describe("Compra", () => {
  describe("crear", () => {
    it("crea una compra PENDIENTE, fija el total y reserva cupo", () => {
      const evento = crearEvento();
      const compra = Compra.crear(
        { comprador: crearComprador(), evento, tipoEntradaId: 1, cantidad: 2 },
        AHORA,
      );
      expect(compra).toMatchObject({ id: null, estado: PENDIENTE, total: 90000, cantidad: 2 });
      expect(compra.fechaCompra).toEqual(AHORA);
      expect(compra.historial).toEqual([
        { estado: PENDIENTE, quien: COMPRADOR_ID, fechaHora: AHORA },
      ]);
      expect(compra.mensajes).toEqual([]);
      expect(evento.tipoEntrada(1).vendidas).toBe(2);
    });

    it("permite comprar exactamente el cupo disponible", () => {
      const evento = crearEvento();
      evento.tipoEntrada(1).reservar(8);
      crearCompra({ evento, cantidad: 2 });
      expect(evento.tipoEntrada(1).disponibles()).toBe(0);
    });

    it("rechaza comprar uno más que el cupo disponible", () => {
      const evento = crearEvento();
      crearCompra({ evento, cantidad: 10 });
      expect(() => crearCompra({ evento, cantidad: 1 })).toThrow(
        "No hay cupo suficiente para Campo",
      );
    });

    it("rechaza dos compras que juntas superan el cupo", () => {
      const evento = crearEvento();
      crearCompra({ evento, cantidad: 6 });
      expect(() => crearCompra({ evento, cantidad: 5 })).toThrow(UnprocessableEntityError);
      expect(evento.tipoEntrada(1).vendidas).toBe(6);
    });

    it("rechaza que compre un organizador", () => {
      expect(() =>
        Compra.crear(
          { comprador: crearOrganizador(), evento: crearEvento(), tipoEntradaId: 1, cantidad: 1 },
          AHORA,
        ),
      ).toThrow("Solo un comprador puede comprar entradas");
    });

    it("rechaza comprar para un evento que ya ocurrió", () => {
      expect(() => crearCompra({ evento: crearEvento({ fecha: AHORA }) })).toThrow(
        "No podés comprar entradas de un evento que ya ocurrió",
      );
    });

    it.each([0, -1, 1.5])("rechaza la cantidad %p sin reservar", (cantidad) => {
      const evento = crearEvento();
      expect(() => crearCompra({ evento, cantidad })).toThrow(
        "La cantidad tiene que ser un entero mayor a 0",
      );
      expect(evento.tipoEntrada(1).vendidas).toBe(0);
    });

    it("tira NotFoundError si el tipo no es del evento", () => {
      expect(() => crearCompra({ tipoEntradaId: 99 })).toThrow(NotFoundError);
    });
  });

  describe("constructor (rehidratar)", () => {
    const base = () => ({
      comprador: crearComprador(),
      evento: crearEvento({ fecha: enDias(-10) }),
      tipoEntradaId: 2,
      cantidad: 1,
      estado: UTILIZADA,
      fechaCompra: enDias(-20),
    });

    it("permite reconstruir una compra en cualquier estado sin tocar el cupo", () => {
      const compra = new Compra(base());
      expect(compra.estado).toBe(UTILIZADA);
      expect(compra.total).toBe(80000);
      expect(compra.evento.tipoEntrada(2).vendidas).toBe(0);
    });

    it("conserva el total recibido", () => {
      expect(new Compra({ ...base(), total: 1 }).total).toBe(1);
    });

    it.each([
      [{ estado: "PERDIDA" }, "El estado de la compra no es válido"],
      [{ comprador: undefined }, "La compra necesita un comprador"],
      [{ evento: undefined }, "La compra necesita un evento"],
      [{ fechaCompra: "x" }, "La fecha de compra no es válida"],
    ])("rechaza %p", (cambio, mensaje) => {
      expect(() => new Compra({ ...base(), ...cambio })).toThrow(mensaje);
    });
  });

  describe("tipoEntrada", () => {
    it("devuelve la misma instancia que vive en el evento", () => {
      const compra = crearCompra();
      expect(compra.tipoEntrada()).toBe(compra.evento.tiposEntrada[0]);
    });
  });

  describe("estado", () => {
    it("es de solo lectura desde afuera", () => {
      const compra = crearCompra();
      expect(() => {
        compra.estado = UTILIZADA;
      }).toThrow(TypeError);
      expect(compra.estado).toBe(PENDIENTE);
    });
  });

  describe("TRANSICIONES", () => {
    it("coincide con la máquina de estados del plan", () => {
      expect(TRANSICIONES).toEqual({
        PENDIENTE: [CONFIRMADA, CANCELADA],
        CONFIRMADA: [UTILIZADA, CANCELADA],
        CANCELADA: [REEMBOLSADA],
        UTILIZADA: [],
        REEMBOLSADA: [],
      });
      expect(Object.isFrozen(TRANSICIONES)).toBe(true);
    });
  });

  describe("pagar", () => {
    it("pasa de PENDIENTE a CONFIRMADA y registra el cambio", () => {
      const compra = crearCompra();
      compra.pagar(COMPRADOR_ID, AHORA);
      expect(compra.estado).toBe(CONFIRMADA);
      expect(compra.historial.at(-1)).toEqual({
        estado: CONFIRMADA,
        quien: COMPRADOR_ID,
        fechaHora: AHORA,
      });
    });

    it.each([CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA])("rechaza pagar desde %s", (estado) => {
      const compra = crearCompra({ estado });
      expect(() => compra.pagar(COMPRADOR_ID, AHORA)).toThrow(
        `No se puede pasar de ${estado} a CONFIRMADA`,
      );
    });

    it("rechaza pagar si el evento ya ocurrió (R3)", () => {
      const compra = crearCompra();
      expect(() => compra.pagar(COMPRADOR_ID, compra.evento.fecha)).toThrow(
        "No podés pagar una compra de un evento que ya ocurrió",
      );
      expect(compra.estado).toBe(PENDIENTE);
    });
  });

  describe("marcarUtilizada", () => {
    it("pasa de CONFIRMADA a UTILIZADA aunque el evento no haya ocurrido", () => {
      const compra = crearCompra({ estado: CONFIRMADA });
      compra.marcarUtilizada(ORGANIZADOR_ID, AHORA);
      expect(compra.estado).toBe(UTILIZADA);
      expect(compra.historial.at(-1).quien).toBe(ORGANIZADOR_ID);
      expect(compra.puedeReseniarse()).toBe(true);
    });

    it.each([PENDIENTE, UTILIZADA, CANCELADA, REEMBOLSADA])(
      "rechaza marcar utilizada desde %s",
      (estado) => {
        const compra = crearCompra({ estado });
        expect(() => compra.marcarUtilizada(ORGANIZADOR_ID, AHORA)).toThrow(
          `No se puede pasar de ${estado} a UTILIZADA`,
        );
      },
    );
  });

  describe("cancelar", () => {
    it("cancela una PENDIENTE, libera cupo y suma un cambio", () => {
      const compra = crearCompra({ cantidad: 2 });
      compra.cancelar(COMPRADOR_ID, AHORA);
      expect(compra.estado).toBe(CANCELADA);
      expect(compra.historial.map((c) => c.estado)).toEqual([PENDIENTE, CANCELADA]);
      expect(compra.tipoEntrada().vendidas).toBe(0);
    });

    it("cancela una CONFIRMADA y la deja REEMBOLSADA con dos cambios", () => {
      const compra = crearCompra({ estado: CONFIRMADA, cantidad: 3 });
      compra.cancelar(COMPRADOR_ID, AHORA);
      expect(compra.estado).toBe(REEMBOLSADA);
      expect(compra.historial.map((c) => c.estado)).toEqual([
        PENDIENTE,
        CONFIRMADA,
        CANCELADA,
        REEMBOLSADA,
      ]);
      expect(compra.tipoEntrada().vendidas).toBe(0);
    });

    it("el cupo liberado lo puede usar otra compra", () => {
      const evento = crearEvento();
      const primera = crearCompra({ evento, cantidad: 10 });
      primera.cancelar(COMPRADOR_ID, AHORA);
      expect(() => crearCompra({ evento, cantidad: 10 })).not.toThrow();
    });

    it("rechaza cancelar una compra utilizada", () => {
      const compra = crearCompra({ estado: UTILIZADA });
      expect(() => compra.cancelar(COMPRADOR_ID, AHORA)).toThrow(
        "No podés cancelar una compra utilizada",
      );
      expect(compra.tipoEntrada().vendidas).toBe(2);
    });

    it.each([CANCELADA, REEMBOLSADA])("rechaza cancelar de nuevo una compra %s", (estado) => {
      const compra = crearCompra({ estado });
      expect(() => compra.cancelar(COMPRADOR_ID, AHORA)).toThrow("La compra ya está cancelada");
    });

    it("una compra cancelada desde PENDIENTE nunca queda REEMBOLSADA (R2b)", () => {
      const compra = crearCompra({ estado: CANCELADA });
      expect(() => compra.cancelar(COMPRADOR_ID, AHORA)).toThrow(UnprocessableEntityError);
      expect(compra.estado).toBe(CANCELADA);
      expect(compra.historial.map((c) => c.estado)).toEqual([PENDIENTE, CANCELADA]);
    });

    it("si ya está cancelada, lo informa aunque el evento haya ocurrido", () => {
      const compra = crearCompra({ estado: CANCELADA });
      expect(() => compra.cancelar(COMPRADOR_ID, enDias(30))).toThrow(
        "La compra ya está cancelada",
      );
    });

    it("rechaza cancelar después del inicio del evento", () => {
      const compra = crearCompra({ estado: CONFIRMADA });
      const unMinutoDespues = new Date(compra.evento.fecha.getTime() + 60_000);
      expect(() => compra.cancelar(COMPRADOR_ID, unMinutoDespues)).toThrow(
        "No podés cancelar una compra de un evento que ya ocurrió",
      );
      expect(compra.estado).toBe(CONFIRMADA);
    });

    it("permite cancelar un instante antes del inicio", () => {
      const compra = crearCompra({ estado: CONFIRMADA });
      compra.cancelar(COMPRADOR_ID, new Date(compra.evento.fecha.getTime() - 1));
      expect(compra.estado).toBe(REEMBOLSADA);
    });
  });

  describe("consultas de estado", () => {
    it.each([
      [PENDIENTE, true, true, false, false],
      [CONFIRMADA, false, true, true, false],
      [UTILIZADA, false, false, false, true],
      [CANCELADA, false, false, false, false],
      [REEMBOLSADA, false, false, false, false],
    ])(
      "%s → pagar %p, cancelar %p, marcar %p, reseñar %p",
      (estado, pagar, cancelar, marcar, reseniar) => {
        const compra = crearCompra({ estado });
        expect(compra.puedePagarse(AHORA)).toBe(pagar);
        expect(compra.puedeCancelarse(AHORA)).toBe(cancelar);
        expect(compra.puedeMarcarseUtilizada()).toBe(marcar);
        expect(compra.puedeReseniarse()).toBe(reseniar);
      },
    );

    it("no se puede pagar ni cancelar si el evento ya ocurrió", () => {
      const compra = crearCompra();
      expect(compra.puedePagarse(compra.evento.fecha)).toBe(false);
      expect(compra.puedeCancelarse(compra.evento.fecha)).toBe(false);
    });
  });

  describe("accionesPara", () => {
    it("al comprador de una PENDIENTE le ofrece pagar y cancelar", () => {
      expect(crearCompra().accionesPara(COMPRADOR_ID, AHORA)).toEqual({
        puedePagar: true,
        puedeCancelar: true,
        puedeMarcarUtilizada: false,
        puedeReseniar: false,
      });
    });

    it("al organizador de una CONFIRMADA solo le ofrece marcar utilizada", () => {
      expect(crearCompra({ estado: CONFIRMADA }).accionesPara(ORGANIZADOR_ID, AHORA)).toEqual({
        puedePagar: false,
        puedeCancelar: false,
        puedeMarcarUtilizada: true,
        puedeReseniar: false,
      });
    });

    it("al comprador de una UTILIZADA le ofrece reseñar", () => {
      expect(crearCompra({ estado: UTILIZADA }).accionesPara(COMPRADOR_ID, AHORA)).toMatchObject({
        puedeReseniar: true,
        puedeCancelar: false,
      });
    });

    it("a un tercero no le ofrece nada", () => {
      expect(Object.values(crearCompra({ estado: CONFIRMADA }).accionesPara(99, AHORA))).toEqual([
        false,
        false,
        false,
        false,
      ]);
    });
  });

  describe("diasRestantes", () => {
    const confirmadaConFecha = (fecha) =>
      crearCompra({ estado: CONFIRMADA, evento: crearEvento({ fecha }) });

    it("devuelve los días que faltan si está CONFIRMADA", () => {
      expect(confirmadaConFecha(enDias(12)).diasRestantes(AHORA)).toBe(12);
    });

    it("redondea hacia arriba: menos de un día cuenta como 1", () => {
      expect(confirmadaConFecha(new Date(AHORA.getTime() + 60_000)).diasRestantes(AHORA)).toBe(1);
      expect(confirmadaConFecha(new Date(AHORA.getTime() + DIA + 1)).diasRestantes(AHORA)).toBe(2);
    });

    it("devuelve 0 si el evento ya ocurrió", () => {
      const compra = confirmadaConFecha(enDias(1));
      expect(compra.diasRestantes(enDias(3))).toBe(0);
    });

    it.each([PENDIENTE, UTILIZADA, CANCELADA, REEMBOLSADA])(
      "devuelve null si está %s",
      (estado) => {
        expect(crearCompra({ estado }).diasRestantes(AHORA)).toBeNull();
      },
    );
  });

  describe("participantes y chat", () => {
    it("participan el comprador y el organizador del evento", () => {
      const compra = crearCompra();
      expect(compra.participa(COMPRADOR_ID)).toBe(true);
      expect(compra.participa(ORGANIZADOR_ID)).toBe(true);
      expect(compra.participa(99)).toBe(false);
      expect(compra.esDe(COMPRADOR_ID)).toBe(true);
      expect(compra.esDe(ORGANIZADOR_ID)).toBe(false);
    });

    it("agrega mensajes con id incremental y snapshot del usuario", () => {
      const compra = crearCompra();
      const primero = compra.agregarMensaje(crearComprador(), "  ¿Hay estacionamiento?  ", AHORA);
      const segundo = compra.agregarMensaje(crearOrganizador(), "Sí", enDias(1));
      expect(primero).toEqual({
        id: 1,
        usuario: { id: COMPRADOR_ID, nombre: "Ana Pérez", rol: Rol.COMPRADOR },
        mensaje: "¿Hay estacionamiento?",
        enviado: AHORA,
      });
      expect(segundo.id).toBe(2);
      expect(segundo.usuario.rol).toBe(Rol.ORGANIZADOR);
      expect(compra.mensajes).toHaveLength(2);
    });

    it("permite escribir en cualquier estado (R7)", () => {
      const compra = crearCompra({ estado: REEMBOLSADA });
      expect(() => compra.agregarMensaje(crearComprador(), "Hola", AHORA)).not.toThrow();
    });

    it.each(["", "   ", "x".repeat(501), undefined])("rechaza el mensaje %p", (texto) => {
      const compra = crearCompra();
      expect(() => compra.agregarMensaje(crearComprador(), texto, AHORA)).toThrow(
        "El mensaje tiene que tener entre 1 y 500 caracteres",
      );
      expect(compra.mensajes).toHaveLength(0);
    });

    it("acepta un mensaje de exactamente 500 caracteres", () => {
      const compra = crearCompra();
      expect(compra.agregarMensaje(crearComprador(), "x".repeat(500), AHORA).mensaje).toHaveLength(
        500,
      );
    });
  });
});

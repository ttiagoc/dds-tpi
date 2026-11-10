import { describe, it, expect, jest, afterEach } from "@jest/globals";
import {
  crearNotificadorSocket,
  notificadorNulo,
  salaDeCompra,
} from "../../src/sockets/notificador.js";

afterEach(() => jest.restoreAllMocks());

function ioFake() {
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));
  return { io: { to }, to, emit };
}

describe("notificador", () => {
  it("salaDeCompra arma el nombre del room", () => {
    expect(salaDeCompra(7)).toBe("compra:7");
  });

  it("mensajeNuevo emite mensaje:nuevo al room de la compra", () => {
    const { io, to, emit } = ioFake();
    const mensaje = { id: 3, mensaje: "Hola" };
    crearNotificadorSocket(io).mensajeNuevo(7, mensaje);
    expect(to).toHaveBeenCalledWith("compra:7");
    expect(emit).toHaveBeenCalledWith("mensaje:nuevo", mensaje);
  });

  it("estadoCompra emite compra:estado con el id y el estado", () => {
    const { io, to, emit } = ioFake();
    crearNotificadorSocket(io).estadoCompra(7, "CONFIRMADA");
    expect(to).toHaveBeenCalledWith("compra:7");
    expect(emit).toHaveBeenCalledWith("compra:estado", { compraId: 7, estado: "CONFIRMADA" });
  });

  it("si el emit tira, lo loguea y no propaga el error", () => {
    const consola = jest.spyOn(console, "error").mockImplementation(() => {});
    const io = {
      to: () => {
        throw new Error("adapter caído");
      },
    };
    const notificador = crearNotificadorSocket(io);
    expect(() => notificador.mensajeNuevo(7, {})).not.toThrow();
    expect(() => notificador.estadoCompra(7, "CONFIRMADA")).not.toThrow();
    expect(consola).toHaveBeenCalledTimes(2);
  });

  it("el notificador nulo no hace nada", () => {
    expect(() => notificadorNulo.mensajeNuevo(7, {})).not.toThrow();
    expect(() => notificadorNulo.estadoCompra(7, "CONFIRMADA")).not.toThrow();
  });
});

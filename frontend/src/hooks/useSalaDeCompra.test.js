import { act, renderHook } from "@testing-library/react-native";
import { io, ultimoSocket } from "socket.io-client";
import { establecerToken } from "../api/cliente";
import { useSalaDeCompra } from "./useSalaDeCompra";

async function montar(compraId = 7, eventos = {}, opciones = {}) {
  const hook = await renderHook(
    ({ eventos: actuales }) => useSalaDeCompra(compraId, actuales, opciones),
    { initialProps: { eventos } },
  );
  return { ...hook, socket: ultimoSocket() };
}

const simular = (socket, evento, ...datos) => act(async () => socket.simular(evento, ...datos));

beforeEach(() => {
  jest.clearAllMocks();
  establecerToken("token-de-prueba");
});

describe("useSalaDeCompra: conexión", () => {
  it("se conecta con el token y arranca sin conexión", async () => {
    const { result } = await montar();
    expect(io).toHaveBeenCalledWith(process.env.EXPO_PUBLIC_API_URL, {
      auth: { token: "token-de-prueba" },
      transports: ["websocket"],
    });
    expect(result.current.conectado).toBe(false);
  });

  it("al conectar se une al room de la compra y queda conectado si el ack es ok", async () => {
    const { result, socket } = await montar(7);
    await simular(socket, "connect");
    expect(socket.emit).toHaveBeenCalledWith(
      "compra:unirse",
      { compraId: 7 },
      expect.any(Function),
    );
    expect(result.current.conectado).toBe(true);
  });

  it("queda sin conexión si el ack es ok: false", async () => {
    const { result, socket } = await montar();
    socket.respuestaAlUnirse = { ok: false, error: "No tenés permiso para realizar esta acción" };
    await simular(socket, "connect");
    expect(result.current.conectado).toBe(false);
  });

  it.each(["disconnect", "connect_error"])("con %s queda sin conexión", async (evento) => {
    const { result, socket } = await montar();
    await simular(socket, "connect");
    await simular(socket, evento, new Error("se cortó"));
    expect(result.current.conectado).toBe(false);
  });
});

describe("useSalaDeCompra: reconexión", () => {
  it("no avisa en la primera conexión", async () => {
    const alReconectar = jest.fn();
    const { socket } = await montar(7, {}, { alReconectar });
    await simular(socket, "connect");
    expect(alReconectar).not.toHaveBeenCalled();
  });

  it.each([
    ["se cortó", (socket) => simular(socket, "disconnect")],
    ["no conectó", (socket) => simular(socket, "connect_error", new Error("No autenticado"))],
  ])("si %s, al volver a unirse se vuelve a unir y avisa una vez", async (_, perder) => {
    const alReconectar = jest.fn();
    const { result, socket } = await montar(7, {}, { alReconectar });
    await simular(socket, "connect");
    await perder(socket);
    await simular(socket, "connect");
    expect(socket.emit.mock.calls.filter(([evento]) => evento === "compra:unirse")).toHaveLength(2);
    expect(result.current.conectado).toBe(true);
    expect(alReconectar).toHaveBeenCalledTimes(1);
    await simular(socket, "connect");
    expect(alReconectar).toHaveBeenCalledTimes(1);
  });

  it("avisa al unirse bien después de un ack fallido", async () => {
    const alReconectar = jest.fn();
    const { socket } = await montar(7, {}, { alReconectar });
    socket.respuestaAlUnirse = { ok: false, error: "No se pudo unir al chat" };
    await simular(socket, "connect");
    socket.respuestaAlUnirse = { ok: true };
    await simular(socket, "connect");
    expect(alReconectar).toHaveBeenCalledTimes(1);
  });
});

describe("useSalaDeCompra: eventos", () => {
  it("pasa los eventos del server al oyente vigente", async () => {
    const primero = jest.fn();
    const segundo = jest.fn();
    const { socket, rerender } = await montar(7, { "mensaje:nuevo": primero });
    await rerender({ eventos: { "mensaje:nuevo": segundo } });
    await simular(socket, "mensaje:nuevo", { id: 3 });
    expect(primero).not.toHaveBeenCalled();
    expect(segundo).toHaveBeenCalledWith({ id: 3 });
  });

  it("al desmontar sale del room, deja de escuchar y desconecta", async () => {
    const alEstado = jest.fn();
    const { socket, unmount } = await montar(7, { "compra:estado": alEstado });
    await act(async () => unmount());
    socket.simular("compra:estado", { compraId: 7, estado: "UTILIZADA" });
    expect(alEstado).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith("compra:salir", { compraId: 7 });
    expect(socket.oyentesDe("connect")).toBe(0);
    expect(socket.disconnect).toHaveBeenCalled();
  });
});

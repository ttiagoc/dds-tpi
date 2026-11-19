import { act, renderHook } from "@testing-library/react-native";
import { ultimoSocket } from "socket.io-client";
import { enviarMensaje, listarMensajes } from "../../api/comprasApi";
import { marcarLeidos } from "../../api/conversacionesApi";
import {
  conversacion,
  errorHttp,
  mensaje,
  paginaDeMensajes,
  promesaManual,
} from "../../test-utils/fixtures";
import { unirMensajes, useChatCompra } from "./useChatCompra";

jest.mock("../../api/comprasApi");
jest.mock("../../api/conversacionesApi");

const { pregunta: PREGUNTA, respuesta: RESPUESTA, nuevo: NUEVO } = conversacion();

async function montar() {
  const { result } = await renderHook(() => useChatCompra(7));
  return { result, socket: ultimoSocket() };
}

const ids = (result) => result.current.mensajes.map((m) => m.id);

beforeEach(() => {
  jest.clearAllMocks();
  listarMensajes.mockResolvedValue(paginaDeMensajes([PREGUNTA, RESPUESTA]));
  enviarMensaje.mockResolvedValue(NUEVO);
});

describe("unirMensajes", () => {
  it("une sin repetir ids y ordena por enviado y después por id", () => {
    const mismoMomento = mensaje({ id: 0, enviado: RESPUESTA.enviado });
    expect(unirMensajes([RESPUESTA, PREGUNTA], [PREGUNTA, mismoMomento]).map((m) => m.id)).toEqual([
      1, 0, 2,
    ]);
  });
});

describe("useChatCompra: historial", () => {
  it("carga los mensajes de la compra en orden", async () => {
    listarMensajes.mockResolvedValue(paginaDeMensajes([RESPUESTA, PREGUNTA]));
    const { result } = await montar();
    expect(listarMensajes).toHaveBeenCalledWith(7);
    expect(ids(result)).toEqual([1, 2]);
  });

  it("expone el error de carga y recargar vuelve a pedir", async () => {
    listarMensajes.mockRejectedValueOnce(errorHttp(500, "Se rompió"));
    const { result } = await montar();
    expect(result.current.error).toBe("Se rompió");
    await act(async () => result.current.recargar());
    expect(listarMensajes).toHaveBeenCalledTimes(2);
    expect(ids(result)).toEqual([1, 2]);
  });

  it("si falla una recarga conserva los mensajes y expone el error", async () => {
    const { result } = await montar();
    listarMensajes.mockRejectedValueOnce(errorHttp(500, "Se rompió"));
    await act(async () => result.current.recargar());
    expect(result.current.error).toBe("Se rompió");
    expect(ids(result)).toEqual([1, 2]);
  });

  it("recarga el historial al reconectarse", async () => {
    const { socket } = await montar();
    await act(async () => socket.simular("connect"));
    await act(async () => socket.simular("disconnect"));
    await act(async () => socket.simular("connect"));
    expect(listarMensajes).toHaveBeenCalledTimes(2);
  });
});

describe("useChatCompra: mensajes anteriores", () => {
  const VIEJO = mensaje({ id: 0, mensaje: "Viejo", enviado: "2026-10-30T10:00:00.000Z" });

  beforeEach(() => {
    listarMensajes.mockResolvedValueOnce(paginaDeMensajes([PREGUNTA, RESPUESTA], true));
  });

  it("expone si hay mensajes anteriores", async () => {
    const { result } = await montar();
    expect(result.current.hayAnteriores).toBe(true);
  });

  it("cargarAnteriores pide los previos al más viejo y los antepone", async () => {
    listarMensajes.mockResolvedValueOnce(paginaDeMensajes([VIEJO]));
    const { result } = await montar();
    await act(async () => result.current.cargarAnteriores());
    expect(listarMensajes).toHaveBeenLastCalledWith(7, { antesDe: 1 });
    expect(ids(result)).toEqual([0, 1, 2]);
    expect(result.current.hayAnteriores).toBe(false);
  });

  it("al recargar conserva los anteriores ya cargados", async () => {
    listarMensajes.mockResolvedValueOnce(paginaDeMensajes([VIEJO]));
    const { result } = await montar();
    await act(async () => result.current.cargarAnteriores());
    listarMensajes.mockResolvedValueOnce(paginaDeMensajes([RESPUESTA, NUEVO], true));
    await act(async () => result.current.recargar());
    expect(ids(result)).toEqual([0, 1, 2, 3]);
    expect(result.current.hayAnteriores).toBe(false);
  });

  it("si falla expone el error y no cambia la lista", async () => {
    listarMensajes.mockRejectedValueOnce(errorHttp(500, "Se rompió"));
    const { result } = await montar();
    await act(async () => result.current.cargarAnteriores());
    expect(result.current.errorAnteriores).toBe("Se rompió");
    expect(ids(result)).toEqual([1, 2]);
    expect(result.current.hayAnteriores).toBe(true);
  });
});

describe("useChatCompra: lectura", () => {
  it("al cargar marca leída la compra", async () => {
    await montar();
    expect(marcarLeidos).toHaveBeenCalledWith(7);
  });

  it("al llegar un mensaje nuevo vuelve a marcar leído", async () => {
    const { socket } = await montar();
    await act(async () => socket.simular("mensaje:nuevo", NUEVO));
    expect(marcarLeidos).toHaveBeenCalledTimes(2);
  });

  it("si marcar leído falla no muestra error", async () => {
    marcarLeidos.mockRejectedValueOnce(new Error("sin red"));
    const { result } = await montar();
    expect(result.current.error).toBeNull();
  });
});

describe("useChatCompra: en vivo", () => {
  it("agrega el mensaje nuevo que llega por el socket", async () => {
    const { result, socket } = await montar();
    await act(async () => socket.simular("mensaje:nuevo", NUEVO));
    expect(ids(result)).toEqual([1, 2, 3]);
  });

  it("no repite un mensaje que ya está", async () => {
    const { result, socket } = await montar();
    await act(async () => socket.simular("mensaje:nuevo", RESPUESTA));
    expect(ids(result)).toEqual([1, 2]);
  });

  it("refleja el estado de la conexión", async () => {
    const { result, socket } = await montar();
    expect(result.current.conectado).toBe(false);
    await act(async () => socket.simular("connect"));
    expect(result.current.conectado).toBe(true);
  });
});

describe("useChatCompra: escribir", () => {
  it.each([
    ["", false],
    ["   ", false],
    [" Hola ", true],
  ])("con el texto %p puedeEnviar es %p", async (texto, puede) => {
    const { result } = await montar();
    await act(async () => result.current.escribir(texto));
    expect(result.current.puedeEnviar).toBe(puede);
  });

  it("envía el texto sin espacios, agrega la respuesta una sola vez y limpia el input", async () => {
    const { result, socket } = await montar();
    await act(async () => result.current.escribir("  ¿Hay guardarropas?  "));
    await act(async () => result.current.enviar());
    await act(async () => socket.simular("mensaje:nuevo", NUEVO));
    expect(enviarMensaje).toHaveBeenCalledWith(7, "¿Hay guardarropas?");
    expect(ids(result)).toEqual([1, 2, 3]);
    expect(result.current.texto).toBe("");
  });

  it("marca el envío en curso y no manda dos veces", async () => {
    const respuesta = promesaManual();
    enviarMensaje.mockReturnValue(respuesta.promesa);
    const { result } = await montar();
    await act(async () => result.current.escribir("Hola"));
    await act(async () => {
      result.current.enviar();
      result.current.enviar();
    });
    expect(result.current.enviando).toBe(true);
    expect(result.current.puedeEnviar).toBe(false);
    await act(async () => respuesta.resolver(NUEVO));
    expect(enviarMensaje).toHaveBeenCalledTimes(1);
    expect(result.current.enviando).toBe(false);
  });

  it("si falla, expone el error, conserva el texto y lo limpia al reintentar", async () => {
    enviarMensaje.mockRejectedValueOnce(
      errorHttp(403, "No tenés permiso para realizar esta acción"),
    );
    const { result } = await montar();
    await act(async () => result.current.escribir("Hola"));
    await act(async () => result.current.enviar());
    expect(result.current.errorEnvio).toBe("No tenés permiso para realizar esta acción");
    expect(result.current.texto).toBe("Hola");
    await act(async () => result.current.enviar());
    expect(result.current.errorEnvio).toBeNull();
    expect(listarMensajes).toHaveBeenCalledTimes(1);
  });
});

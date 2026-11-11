import { renderHook, act } from "@testing-library/react-native";
import { useEnvio } from "./useEnvio";
import { errorHttp, promesaManual } from "../test-utils/fixtures";

async function montar(opciones) {
  const { result } = await renderHook(() => useEnvio(opciones));
  return result;
}

describe("useEnvio", () => {
  it("marca la acción en curso y pasa la respuesta al terminar", async () => {
    const respuesta = promesaManual();
    const alResolver = jest.fn();
    const result = await montar();
    await act(async () => {
      result.current.enviar("pagar", () => respuesta.promesa, alResolver);
    });
    expect(result.current.enCurso).toBe("pagar");
    await act(async () => respuesta.resolver("ok"));
    expect(alResolver).toHaveBeenCalledWith("ok");
    expect(result.current.enCurso).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("ignora un segundo envío mientras hay uno en curso", async () => {
    const respuesta = promesaManual();
    const pedir = jest.fn(() => respuesta.promesa);
    const result = await montar();
    await act(async () => {
      result.current.enviar("pagar", pedir, jest.fn());
      result.current.enviar("cancelar", pedir, jest.fn());
    });
    expect(pedir).toHaveBeenCalledTimes(1);
    await act(async () => respuesta.resolver("ok"));
  });

  it("con 422 guarda el mensaje del back y recarga", async () => {
    const recargar = jest.fn();
    const alResolver = jest.fn();
    const result = await montar({ recargar });
    await act(() =>
      result.current.enviar(
        "pagar",
        () => Promise.reject(errorHttp(422, "No podés pagar")),
        alResolver,
      ),
    );
    expect(result.current.error).toBe("No podés pagar");
    expect(recargar).toHaveBeenCalledTimes(1);
    expect(alResolver).not.toHaveBeenCalled();
    expect(result.current.enCurso).toBeNull();
  });

  it("con otro error guarda el mensaje sin recargar y lo limpia al reenviar", async () => {
    const recargar = jest.fn();
    const result = await montar({ recargar });
    await act(() =>
      result.current.enviar("pagar", () => Promise.reject(new Error("red")), jest.fn()),
    );
    expect(result.current.error).toBe("No pudimos conectar con el servidor");
    expect(recargar).not.toHaveBeenCalled();
    await act(() => result.current.enviar("pagar", () => Promise.resolve("ok"), jest.fn()));
    expect(result.current.error).toBeNull();
  });
});

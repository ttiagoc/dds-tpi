import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useCargar } from "./useCargar";
import { errorHttp } from "../test-utils/fixtures";

describe("useCargar", () => {
  it("arranca cargando y después expone los datos", async () => {
    const cargar = jest.fn().mockResolvedValue([1, 2]);
    const { result } = await renderHook(() => useCargar(cargar));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.datos).toEqual([1, 2]);
    expect(result.current.error).toBeNull();
  });

  it("expone el mensaje de error del back", async () => {
    const cargar = jest.fn().mockRejectedValue(errorHttp(404, "No existe el evento"));
    const { result } = await renderHook(() => useCargar(cargar));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toBe("No existe el evento");
    expect(result.current.codigoError).toBe(404);
    expect(result.current.datos).toBeNull();
  });

  it("sin respuesta del servidor no hay código de error", async () => {
    const cargar = jest.fn().mockRejectedValue(new Error("red"));
    const { result } = await renderHook(() => useCargar(cargar));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.codigoError).toBeNull();
  });

  it("con una función estable carga una sola vez aunque se vuelva a renderizar", async () => {
    const cargar = jest.fn().mockResolvedValue("ok");
    const { result, rerender } = await renderHook(() => useCargar(cargar));
    await waitFor(() => expect(result.current.datos).toBe("ok"));
    await rerender({});
    await rerender({});
    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it("vuelve a cargar si cambia la función", async () => {
    const primera = jest.fn().mockResolvedValue("uno");
    const segunda = jest.fn().mockResolvedValue("dos");
    const { result, rerender } = await renderHook(({ cargar }) => useCargar(cargar), {
      initialProps: { cargar: primera },
    });
    await waitFor(() => expect(result.current.datos).toBe("uno"));
    await rerender({ cargar: segunda });
    await waitFor(() => expect(result.current.datos).toBe("dos"));
  });

  it("mientras recarga conserva los datos anteriores", async () => {
    let responder;
    const cargar = jest
      .fn()
      .mockResolvedValueOnce("viejo")
      .mockReturnValueOnce(new Promise((resolve) => (responder = resolve)));
    const { result } = await renderHook(() => useCargar(cargar));
    await waitFor(() => expect(result.current.datos).toBe("viejo"));
    await act(() => result.current.recargar());
    expect(result.current.cargando).toBe(true);
    expect(result.current.datos).toBe("viejo");
    await act(() => responder("nuevo"));
    expect(result.current).toMatchObject({ cargando: false, datos: "nuevo" });
  });

  it("recargar vuelve a llamar a la función y limpia el error", async () => {
    const cargar = jest.fn().mockRejectedValueOnce(new Error("red")).mockResolvedValueOnce("ok");
    const { result } = await renderHook(() => useCargar(cargar));
    await waitFor(() => expect(result.current.error).toBe("No pudimos conectar con el servidor"));
    await act(() => result.current.recargar());
    await waitFor(() => expect(result.current.datos).toBe("ok"));
    expect(result.current.error).toBeNull();
    expect(cargar).toHaveBeenCalledTimes(2);
  });
});

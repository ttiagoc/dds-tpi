import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useCargar } from "./useCargar";
import { errorHttp } from "../test-utils/fixtures";

async function cambiarDeFuncion(segunda) {
  const { result, rerender } = await renderHook(({ cargar }) => useCargar(cargar), {
    initialProps: { cargar: jest.fn().mockResolvedValue("uno") },
  });
  await waitFor(() => expect(result.current.datos).toBe("uno"));
  await rerender({ cargar: segunda });
  return result;
}

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
    const result = await cambiarDeFuncion(jest.fn().mockResolvedValue("dos"));
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

  it("si falla una recarga conserva los datos anteriores y expone el error", async () => {
    const cargar = jest.fn().mockResolvedValueOnce("viejo").mockRejectedValueOnce(new Error("red"));
    const { result } = await renderHook(() => useCargar(cargar));
    await waitFor(() => expect(result.current.datos).toBe("viejo"));
    await act(() => result.current.recargar());
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.datos).toBe("viejo");
    expect(result.current.error).toBe("No pudimos conectar con el servidor");
  });

  it("si falla la carga de otra función no conserva los datos de la anterior", async () => {
    const result = await cambiarDeFuncion(jest.fn().mockRejectedValue(new Error("red")));
    await waitFor(() => expect(result.current.error).toBe("No pudimos conectar con el servidor"));
    expect(result.current.datos).toBeNull();
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

  it("reemplazar cambia los datos sin volver a cargar", async () => {
    const cargar = jest.fn().mockResolvedValue("viejo");
    const { result } = await renderHook(() => useCargar(cargar));
    await waitFor(() => expect(result.current.datos).toBe("viejo"));
    await act(() => result.current.reemplazar("nuevo"));
    expect(result.current.datos).toBe("nuevo");
    expect(result.current.cargando).toBe(false);
    expect(cargar).toHaveBeenCalledTimes(1);
  });
});

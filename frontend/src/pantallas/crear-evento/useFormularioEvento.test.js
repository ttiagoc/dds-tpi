import { act, renderHook } from "@testing-library/react-native";
import { useFormularioEvento } from "./useFormularioEvento";

jest.mock("../../api/eventosApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

describe("useFormularioEvento: tipos", () => {
  it("agrega hasta 10 tipos y después no deja agregar más", async () => {
    const { result } = await renderHook(() => useFormularioEvento());
    for (let i = 1; i < 10; i += 1) await act(() => result.current.agregarTipo());
    expect(result.current.valores.tipos).toHaveLength(10);
    expect(result.current.puedeAgregarTipo).toBe(false);
    await act(() => result.current.agregarTipo());
    expect(result.current.valores.tipos).toHaveLength(10);
  });

  it("no quita el último tipo", async () => {
    const { result } = await renderHook(() => useFormularioEvento());
    await act(() => result.current.quitarTipo(0));
    expect(result.current.valores.tipos).toHaveLength(1);
  });

  it("cada tipo nuevo tiene una clave distinta", async () => {
    const { result } = await renderHook(() => useFormularioEvento());
    await act(() => result.current.agregarTipo());
    await act(() => result.current.agregarTipo());
    const claves = result.current.valores.tipos.map((tipo) => tipo.clave);
    expect(new Set(claves).size).toBe(3);
  });
});

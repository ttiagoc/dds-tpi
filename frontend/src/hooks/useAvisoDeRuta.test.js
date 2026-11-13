import { act, renderHook } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAvisoDeRuta } from "./useAvisoDeRuta";

jest.mock("expo-router", () => require("../test-utils/mockRouter").mockRouter());

const AVISOS = { creado: "Evento publicado" };

beforeEach(() => jest.clearAllMocks());

describe("useAvisoDeRuta", () => {
  it("traduce el parámetro aviso y al cerrar lo limpia", async () => {
    useLocalSearchParams.mockReturnValue({ aviso: "creado" });
    const { result } = await renderHook(() => useAvisoDeRuta(AVISOS));
    expect(result.current.texto).toBe("Evento publicado");
    await act(() => result.current.cerrar());
    expect(router.setParams).toHaveBeenCalledWith({ aviso: undefined });
  });

  it("sin parámetro o con uno desconocido no hay texto ni limpia nada", async () => {
    useLocalSearchParams.mockReturnValue({ aviso: "otro" });
    const { result } = await renderHook(() => useAvisoDeRuta(AVISOS));
    expect(result.current.texto).toBeNull();
    await act(() => result.current.cerrar());
    expect(router.setParams).not.toHaveBeenCalled();
  });
});

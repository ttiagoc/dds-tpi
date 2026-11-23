import { act, renderHook } from "@testing-library/react-native";
import * as Brightness from "expo-brightness";
import { AppState } from "react-native";
import { useBrilloMaximo } from "./useBrilloMaximo";

jest.mock("expo-brightness", () => ({
  isAvailableAsync: jest.fn(),
  getBrightnessAsync: jest.fn(),
  setBrightnessAsync: jest.fn(),
}));

let alCambiarApp;
const quitarOyente = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  Brightness.isAvailableAsync.mockResolvedValue(true);
  Brightness.getBrightnessAsync.mockResolvedValue(0.4);
  Brightness.setBrightnessAsync.mockResolvedValue();
  jest.spyOn(AppState, "addEventListener").mockImplementation((_, oyente) => {
    alCambiarApp = oyente;
    return { remove: quitarOyente };
  });
});

const montar = async (activo) => {
  const hook = await renderHook(({ activo: a }) => useBrilloMaximo(a), {
    initialProps: { activo },
  });
  await act(async () => {});
  return hook;
};

describe("useBrilloMaximo", () => {
  it("inactivo no toca el brillo", async () => {
    await montar(false);
    expect(Brightness.setBrightnessAsync).not.toHaveBeenCalled();
  });

  it("al activarse sube al máximo y al desactivarse vuelve al anterior", async () => {
    const { rerender } = await montar(true);
    expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(1);
    await rerender({ activo: false });
    expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(0.4);
    expect(quitarOyente).toHaveBeenCalled();
  });

  it("si la app pasa a segundo plano lo restaura y al volver lo sube de nuevo", async () => {
    await montar(true);
    await act(async () => alCambiarApp("background"));
    expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(0.4);
    await act(async () => alCambiarApp("active"));
    expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(1);
    expect(Brightness.getBrightnessAsync).toHaveBeenCalledTimes(1);
  });

  it("sin brillo disponible no hace nada", async () => {
    Brightness.isAvailableAsync.mockResolvedValue(false);
    const { unmount } = await montar(true);
    await unmount();
    expect(Brightness.setBrightnessAsync).not.toHaveBeenCalled();
  });
});

import { act, renderHook } from "@testing-library/react-native";
import { useFocusEffect } from "expo-router";
import { useRecargarAlVolver } from "./useRecargarAlVolver";

jest.mock("expo-router", () => require("../test-utils/mockRouter").mockRouter());

const enfocar = () => act(() => useFocusEffect.mock.calls.at(-1)[0]());

describe("useRecargarAlVolver", () => {
  it("saltea el primer foco y recarga en los siguientes", async () => {
    const recargar = jest.fn();
    await renderHook(() => useRecargarAlVolver(recargar));
    await enfocar();
    expect(recargar).not.toHaveBeenCalled();
    await enfocar();
    await enfocar();
    expect(recargar).toHaveBeenCalledTimes(2);
  });
});

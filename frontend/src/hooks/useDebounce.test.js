import { renderHook, act } from "@testing-library/react-native";
import { useDebounce } from "./useDebounce";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useDebounce", () => {
  it("devuelve el valor recién cuando deja de cambiar durante el tiempo indicado", async () => {
    const { result, rerender } = await renderHook(({ valor }) => useDebounce(valor, 300), {
      initialProps: { valor: "" },
    });
    await rerender({ valor: "pi" });
    await act(() => jest.advanceTimersByTime(200));
    await rerender({ valor: "piojos" });
    await act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe("");
    await act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe("piojos");
  });
});

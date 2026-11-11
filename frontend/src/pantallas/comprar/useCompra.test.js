import { renderHook, act } from "@testing-library/react-native";
import { useSeleccion } from "./useCompra";

const tipo = (id, disponibles) => ({ id, nombre: `Tipo ${id}`, precio: 1000, disponibles });

const montar = (tipos) =>
  renderHook(({ tipos: actuales }) => useSeleccion(actuales), { initialProps: { tipos } });

describe("useSeleccion", () => {
  it("preselecciona el primer tipo con disponibles y cantidad 1", async () => {
    const { result } = await montar([tipo(1, 0), tipo(2, 5)]);
    expect(result.current.tipo.id).toBe(2);
    expect(result.current.cantidad).toBe(1);
    expect(result.current.maximo).toBe(5);
  });

  it("el máximo nunca pasa de 10", async () => {
    const { result } = await montar([tipo(1, 40)]);
    expect(result.current.maximo).toBe(10);
  });

  it("al cambiar a un tipo con menos disponibles la cantidad baja al tope", async () => {
    const { result } = await montar([tipo(1, 8), tipo(2, 3)]);
    await act(() => result.current.elegirCantidad(6));
    await act(() => result.current.elegirTipo(2));
    expect(result.current.tipo.id).toBe(2);
    expect(result.current.cantidad).toBe(3);
  });

  it("si el elegido se agota, pasa al primero con disponibles", async () => {
    const { result, rerender } = await montar([tipo(1, 8), tipo(2, 3)]);
    await act(() => result.current.elegirTipo(2));
    await rerender({ tipos: [tipo(1, 8), tipo(2, 0)] });
    expect(result.current.tipo.id).toBe(1);
  });

  it("si bajan los disponibles del elegido, la cantidad se ajusta", async () => {
    const { result, rerender } = await montar([tipo(1, 5)]);
    await act(() => result.current.elegirCantidad(4));
    await rerender({ tipos: [tipo(1, 2)] });
    expect(result.current.cantidad).toBe(2);
  });

  it("sin disponibles no hay tipo y el máximo es 0", async () => {
    const { result } = await montar([tipo(1, 0)]);
    expect(result.current.tipo).toBeNull();
    expect(result.current.maximo).toBe(0);
  });
});

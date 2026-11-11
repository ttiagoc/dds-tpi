import { renderHook, waitFor, act } from "@testing-library/react-native";
import { paginaDe, useListaPaginada } from "./useListaPaginada";
import { promesaManual } from "../test-utils/fixtures";

const CRITERIO = { ordenarPor: "fecha", orden: "asc" };
const pagina = (items, page, totalPages) => ({ items, page, totalPages });
const pedir = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe("useListaPaginada", () => {
  it("pide la página 1 con el criterio y el límite, y expone los items", async () => {
    pedir.mockResolvedValue(pagina([{ id: 1 }], 1, 1));
    const { result } = await renderHook(() => useListaPaginada(pedir, CRITERIO));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(pedir).toHaveBeenCalledWith(CRITERIO, { page: 1, limit: 10 });
    expect(result.current.items).toEqual([{ id: 1 }]);
    expect(result.current.hayMas).toBe(false);
  });

  it("al recargar con el mismo criterio conserva los items mientras carga", async () => {
    const recarga = promesaManual();
    pedir.mockResolvedValueOnce(pagina([{ id: 1 }], 1, 1)).mockReturnValueOnce(recarga.promesa);
    const { result } = await renderHook(() => useListaPaginada(pedir, CRITERIO));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    await act(() => result.current.recargar());
    expect(result.current.cargando).toBe(true);
    expect(result.current.items).toEqual([{ id: 1 }]);
    await act(() => recarga.resolver(pagina([{ id: 2 }], 1, 1)));
    expect(result.current.items).toEqual([{ id: 2 }]);
  });

  it("dos cargarMas seguidos piden la página siguiente una sola vez", async () => {
    const pagina2 = promesaManual();
    pedir.mockResolvedValueOnce(pagina([{ id: 1 }], 1, 3)).mockReturnValueOnce(pagina2.promesa);
    const { result } = await renderHook(() => useListaPaginada(pedir, CRITERIO));
    await waitFor(() => expect(result.current.hayMas).toBe(true));
    await act(() => {
      result.current.cargarMas();
      result.current.cargarMas();
    });
    expect(pedir).toHaveBeenCalledTimes(2);
    expect(pedir).toHaveBeenLastCalledWith(CRITERIO, { page: 2, limit: 10 });
    await act(() => pagina2.resolver(pagina([{ id: 2 }], 2, 3)));
    expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe("paginaDe", () => {
  it("pide con el criterio y la página y adapta la respuesta a items", async () => {
    const listar = jest
      .fn()
      .mockResolvedValue({ compras: [{ id: 3 }], total: 1, page: 2, totalPages: 4 });
    const pedirCompras = paginaDe(listar, "compras");
    expect(await pedirCompras({ estado: "PENDIENTE" }, { page: 2, limit: 10 })).toEqual({
      items: [{ id: 3 }],
      page: 2,
      totalPages: 4,
    });
    expect(listar).toHaveBeenCalledWith({ estado: "PENDIENTE", page: 2, limit: 10 });
  });
});

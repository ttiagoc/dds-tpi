import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useEventosPaginados } from "./useEventosPaginados";
import { buscarEventos } from "../../api/eventosApi";
import { eventoResumen, paginaDeEventos, promesaManual } from "../../test-utils/fixtures";

jest.mock("../../api/eventosApi");

const CRITERIO = { ordenarPor: "fecha", orden: "asc" };

describe("useEventosPaginados", () => {
  it("dos cargarMas seguidos piden la página siguiente una sola vez", async () => {
    const pagina2 = promesaManual();
    buscarEventos
      .mockResolvedValueOnce(paginaDeEventos([eventoResumen()], { page: 1, totalPages: 3 }))
      .mockReturnValueOnce(pagina2.promesa);
    const { result } = await renderHook(() => useEventosPaginados(CRITERIO));
    await waitFor(() => expect(result.current.hayMas).toBe(true));
    await act(() => {
      result.current.cargarMas();
      result.current.cargarMas();
    });
    expect(buscarEventos).toHaveBeenCalledTimes(2);
    await act(() =>
      pagina2.resolver(paginaDeEventos([eventoResumen({ id: 2 })], { page: 2, totalPages: 3 })),
    );
    expect(result.current.eventos).toHaveLength(2);
  });
});

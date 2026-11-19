import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";
import { ultimoSocket } from "socket.io-client";
import { listarConversaciones } from "../api/conversacionesApi";
import { ANA, Providers } from "../test-utils/renderConProviders";
import { paginaDeConversaciones } from "../test-utils/fixtures";
import { NoLeidosProvider, textoBadge, useNoLeidos } from "./NoLeidosContext";

jest.mock("../api/conversacionesApi");

const conTotal = (totalNoLeidos) => paginaDeConversaciones([], { totalNoLeidos });

function montar(usuario = ANA) {
  const envoltorio = ({ children }) => (
    <Providers usuario={usuario}>
      <NoLeidosProvider>{children}</NoLeidosProvider>
    </Providers>
  );
  return renderHook(() => useNoLeidos(), { wrapper: envoltorio });
}

beforeEach(() => {
  jest.clearAllMocks();
  listarConversaciones.mockResolvedValue(conTotal(3));
});

describe("NoLeidosProvider", () => {
  it("al iniciar sesión pide el total con una sola conversación", async () => {
    const { result } = await montar();
    expect(listarConversaciones).toHaveBeenCalledWith({ limit: 1 });
    expect(result.current.total).toBe(3);
  });

  it("sin sesión no pide nada y el total es 0", async () => {
    const { result } = await montar(null);
    expect(listarConversaciones).not.toHaveBeenCalled();
    expect(result.current.total).toBe(0);
  });

  it("con conversacion:actualizada vuelve a pedir el total y sube la versión", async () => {
    const { result } = await montar();
    listarConversaciones.mockResolvedValue(conTotal(4));
    await act(async () => ultimoSocket().simular("conversacion:actualizada", { compraId: 7 }));
    expect(result.current.total).toBe(4);
    expect(result.current.version).toBe(1);
  });

  it("al volver la app a primer plano refresca", async () => {
    const espia = jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove: jest.fn() });
    await montar();
    const alCambiar = espia.mock.calls.at(-1)[1];
    await act(async () => alCambiar("active"));
    expect(listarConversaciones).toHaveBeenCalledTimes(2);
    espia.mockRestore();
  });

  it("si falla el pedido conserva el total anterior", async () => {
    const { result } = await montar();
    listarConversaciones.mockRejectedValueOnce(new Error("sin red"));
    await act(async () => result.current.refrescar());
    expect(result.current.total).toBe(3);
  });
});

it("fuera del provider devuelve una bandeja vacía", async () => {
  const { result } = await renderHook(() => useNoLeidos());
  expect(result.current.total).toBe(0);
  expect(() => result.current.refrescar()).not.toThrow();
});

it.each([
  [0, undefined],
  [5, 5],
  [99, 99],
  [100, "99+"],
])("textoBadge(%p) es %p", (total, esperado) => {
  expect(textoBadge(total)).toBe(esperado);
});

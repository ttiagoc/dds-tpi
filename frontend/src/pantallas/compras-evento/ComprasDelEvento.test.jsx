import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import ComprasDelEvento from "./ComprasDelEvento";
import { listarComprasDelEvento } from "../../api/eventosApi";
import { FENIX, renderConProviders } from "../../test-utils/renderConProviders";
import { compraResumen, comprasDelEvento, errorHttp } from "../../test-utils/fixtures";

jest.mock("../../api/eventosApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const DE_ANA = compraResumen({ id: 7 });
const DE_BRUNO = compraResumen({
  id: 8,
  estado: "PENDIENTE",
  comprador: { id: 4, nombre: "Bruno Gómez" },
});
const ultimoPedido = () => listarComprasDelEvento.mock.calls.at(-1);
const enfocar = () => act(() => useFocusEffect.mock.calls.at(-1)[0]());

async function abrir() {
  await renderConProviders(<ComprasDelEvento />, { usuario: FENIX });
  await screen.findByTestId("compra-7");
}

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({ id: "1" });
  listarComprasDelEvento.mockResolvedValue(comprasDelEvento([DE_ANA, DE_BRUNO]));
});

describe("ComprasDelEvento: datos", () => {
  it("muestra el evento y la disponibilidad por tipo", async () => {
    await abrir();
    expect(ultimoPedido()).toEqual(["1", { page: 1, limit: 10 }]);
    expect(screen.getByText("Los Piojos en River")).toBeTruthy();
    expect(screen.getByTestId("disponibilidad-10")).toHaveTextContent(/Campo/);
    expect(screen.getByTestId("disponibilidad-10")).toHaveTextContent(/60 de 100 vendidas/);
    expect(screen.getByTestId("disponibilidad-10")).toHaveTextContent(/Quedan 40/);
    expect(screen.getByTestId("disponibilidad-11")).toHaveTextContent(/Agotado/);
  });

  it("lista las compras con el comprador y su estado, y abre el detalle", async () => {
    await abrir();
    expect(screen.getByTestId("compra-7")).toHaveTextContent(/Ana Pérez/);
    expect(screen.getByTestId("compra-8")).toHaveTextContent(/Bruno Gómez/);
    expect(screen.getByLabelText("Estado: Pendiente")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("compra-8"));
    expect(router.push).toHaveBeenCalledWith("/compras/8");
  });

  it("Escanear entrada abre el escáner del evento", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("escanear-entrada"));
    expect(router.push).toHaveBeenCalledWith("/eventos/1/escanear");
  });

  it("al recuperar el foco vuelve a pedir", async () => {
    await abrir();
    await enfocar();
    await enfocar();
    await waitFor(() => expect(listarComprasDelEvento).toHaveBeenCalledTimes(2));
  });
});

describe("ComprasDelEvento: filtro", () => {
  it("filtra por estado sin perder la disponibilidad", async () => {
    await abrir();
    listarComprasDelEvento.mockResolvedValue(comprasDelEvento([], { totalPages: 0 }));
    await fireEvent.press(screen.getByTestId("filtro-estado-UTILIZADA"));
    expect(await screen.findByText("No hay compras en estado Utilizada")).toBeTruthy();
    expect(ultimoPedido()).toEqual(["1", { estado: "UTILIZADA", page: 1, limit: 10 }]);
    expect(screen.getByTestId("disponibilidad-10")).toHaveTextContent(/Quedan 40/);
    listarComprasDelEvento.mockResolvedValue(comprasDelEvento([DE_ANA]));
    await fireEvent.press(screen.getByTestId("ver-todas"));
    await screen.findByTestId("compra-7");
    expect(ultimoPedido()).toEqual(["1", { page: 1, limit: 10 }]);
  });

  it("sin compras y sin filtro lo avisa", async () => {
    listarComprasDelEvento.mockResolvedValue(comprasDelEvento([], { totalPages: 0 }));
    await renderConProviders(<ComprasDelEvento />, { usuario: FENIX });
    expect(await screen.findByText("Este evento todavía no tiene compras")).toBeTruthy();
  });
});

describe("ComprasDelEvento: errores", () => {
  it("con 403 muestra el texto del back y Reintentar", async () => {
    listarComprasDelEvento.mockRejectedValue(
      errorHttp(403, "No tenés permiso para realizar esta acción"),
    );
    await renderConProviders(<ComprasDelEvento />, { usuario: FENIX });
    expect(await screen.findByText("No tenés permiso para realizar esta acción")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
    expect(screen.queryByTestId("disponibilidad-10")).toBeNull();
  });
});

import { screen, fireEvent } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import DetalleCompra from "./DetalleCompra";
import { obtenerCompra } from "../../api/comprasApi";
import { renderConProviders, ANA } from "../../test-utils/renderConProviders";
import { compraDetalle, errorHttp } from "../../test-utils/fixtures";

jest.mock("../../api/comprasApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const REEMBOLSADA = compraDetalle({
  estado: "REEMBOLSADA",
  diasRestantes: null,
  historial: ["PENDIENTE", "CONFIRMADA", "CANCELADA", "REEMBOLSADA"].map((estado, i) => ({
    estado,
    quien: { id: 1, nombre: "Ana Pérez" },
    fechaHora: `2026-11-0${i + 1}T15:00:00.000Z`,
  })),
});

async function abrir() {
  await renderConProviders(<DetalleCompra />, { usuario: ANA });
  await screen.findByTestId("linea-de-tiempo");
}

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({ id: "7" });
  obtenerCompra.mockResolvedValue(compraDetalle());
});

describe("DetalleCompra: datos", () => {
  it("muestra estado, días restantes, evento, tipo, cantidad y total", async () => {
    await abrir();
    expect(obtenerCompra).toHaveBeenCalledWith("7");
    expect(screen.getByTestId("compra-estado")).toHaveTextContent(/Confirmada/);
    expect(screen.getByTestId("dias-restantes")).toHaveTextContent("Faltan 12 días");
    expect(screen.getByTestId("compra-evento")).toHaveTextContent(/Los Piojos en River/);
    expect(screen.getByText(/Campo × 2/)).toBeTruthy();
    expect(screen.getByText(/\$\s45\.000 c\/u/)).toBeTruthy();
    expect(screen.getByTestId("compra-total")).toHaveTextContent(/Total: \$\s90\.000/);
  });

  it("muestra la línea de tiempo completa de una compra reembolsada, sin acciones", async () => {
    obtenerCompra.mockResolvedValue(REEMBOLSADA);
    await abrir();
    expect(screen.queryByTestId("dias-restantes")).toBeNull();
    ["Pendiente", "Confirmada", "Cancelada", "Reembolsada"].forEach((etiqueta, i) =>
      expect(screen.getByTestId(`historial-${i}`)).toHaveTextContent(new RegExp(etiqueta)),
    );
    expect(screen.queryByRole("button", { name: /Pagar|Cancelar|Reseñar|Chat/ })).toBeNull();
  });

  it("tocar el evento abre su detalle", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("compra-evento"));
    expect(router.push).toHaveBeenCalledWith("/eventos/1");
  });
});

describe("DetalleCompra: errores", () => {
  it.each([
    [404, "No existe la compra"],
    [403, "No tenés permiso para realizar esta acción"],
  ])("con %i muestra el mensaje y Volver, sin Reintentar", async (status, mensaje) => {
    obtenerCompra.mockRejectedValue(errorHttp(status, mensaje));
    await renderConProviders(<DetalleCompra />, { usuario: ANA });
    expect(await screen.findByTestId("compra-inexistente")).toHaveTextContent(new RegExp(mensaje));
    expect(screen.getByTestId("volver")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("otro error muestra Reintentar", async () => {
    obtenerCompra.mockRejectedValueOnce(new Error("red"));
    await renderConProviders(<DetalleCompra />, { usuario: ANA });
    await fireEvent.press(await screen.findByRole("button", { name: "Reintentar" }));
    await screen.findByTestId("linea-de-tiempo");
  });
});

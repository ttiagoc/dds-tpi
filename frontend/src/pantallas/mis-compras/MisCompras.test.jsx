import { screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import MisCompras from "./MisCompras";
import { listarMisCompras } from "../../api/comprasApi";
import { renderConProviders, ANA } from "../../test-utils/renderConProviders";
import { compraResumen, paginaDeCompras } from "../../test-utils/fixtures";
import { espaciado } from "../../tema/espaciado";

jest.mock("../../api/comprasApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const CONFIRMADA = compraResumen({ id: 7 });
const REEMBOLSADA = compraResumen({ id: 8, estado: "REEMBOLSADA", diasRestantes: null });
const ultimoPedido = () => listarMisCompras.mock.calls.at(-1)[0];
const enfocar = () => act(() => useFocusEffect.mock.calls.at(-1)[0]());

async function abrir() {
  await renderConProviders(<MisCompras />, { usuario: ANA });
  await screen.findByTestId("compra-7");
}

beforeEach(() => {
  jest.clearAllMocks();
  listarMisCompras.mockResolvedValue(paginaDeCompras([CONFIRMADA, REEMBOLSADA]));
});

describe("MisCompras: encabezado", () => {
  it("separa el título de los filtros", async () => {
    await abrir();
    const encabezado = screen.getByTestId("lista-compras-encabezado");
    expect(StyleSheet.flatten(encabezado.props.style).gap).toBe(espaciado.md);
    expect(screen.getByTestId("titulo-pestania")).toHaveTextContent("Mis entradas");
  });
});

describe("MisCompras: lista y filtro", () => {
  it("muestra las compras en el orden del back con estado y días restantes", async () => {
    await abrir();
    expect(ultimoPedido()).toEqual({ page: 1, limit: 10 });
    expect(screen.getByLabelText("Estado: Confirmada")).toBeTruthy();
    expect(screen.getByLabelText("Estado: Reembolsada")).toBeTruthy();
    expect(screen.getByTestId("dias-restantes-7")).toHaveTextContent("Faltan 12 días");
  });

  it("filtra por estado y Todas quita el filtro", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("filtro-estado-REEMBOLSADA"));
    await waitFor(() =>
      expect(ultimoPedido()).toEqual({ estado: "REEMBOLSADA", page: 1, limit: 10 }),
    );
    await fireEvent.press(screen.getByTestId("filtro-estado-todas"));
    await waitFor(() => expect(ultimoPedido()).toEqual({ page: 1, limit: 10 }));
  });

  it("Cargar más agrega la página siguiente", async () => {
    listarMisCompras
      .mockResolvedValueOnce(paginaDeCompras([CONFIRMADA], { page: 1, totalPages: 2 }))
      .mockResolvedValueOnce(paginaDeCompras([REEMBOLSADA], { page: 2, totalPages: 2 }));
    await abrir();
    await fireEvent.press(screen.getByTestId("cargar-mas"));
    await screen.findByTestId("compra-8");
    expect(ultimoPedido()).toEqual({ page: 2, limit: 10 });
  });

  it("tocar una compra abre su detalle", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("compra-8"));
    expect(router.push).toHaveBeenCalledWith("/compras/8");
  });
});

describe("MisCompras: refresco al volver", () => {
  it("al recuperar el foco vuelve a pedir la lista, sin pedir de más al entrar", async () => {
    await abrir();
    await enfocar();
    expect(listarMisCompras).toHaveBeenCalledTimes(1);
    listarMisCompras.mockResolvedValue(paginaDeCompras([compraResumen({ id: 9 }), CONFIRMADA]));
    await enfocar();
    await screen.findByTestId("compra-9");
    expect(listarMisCompras).toHaveBeenCalledTimes(2);
  });
});

describe("MisCompras: vacío y error", () => {
  it("sin compras invita a explorar eventos", async () => {
    listarMisCompras.mockResolvedValue(paginaDeCompras([], { totalPages: 0 }));
    await renderConProviders(<MisCompras />, { usuario: ANA });
    expect(await screen.findByText("Todavía no compraste entradas")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Explorar eventos" }));
    expect(router.navigate).toHaveBeenCalledWith("/explorar");
  });

  it("con un filtro sin compras ofrece ver todas", async () => {
    await abrir();
    listarMisCompras.mockResolvedValue(paginaDeCompras([], { totalPages: 0 }));
    await fireEvent.press(screen.getByTestId("filtro-estado-UTILIZADA"));
    expect(await screen.findByText("No tenés compras en estado Utilizada")).toBeTruthy();
    listarMisCompras.mockResolvedValue(paginaDeCompras([CONFIRMADA]));
    await fireEvent.press(screen.getByRole("button", { name: "Ver todas" }));
    await screen.findByTestId("compra-7");
    expect(ultimoPedido()).toEqual({ page: 1, limit: 10 });
  });

  it("muestra el error del back y Reintentar vuelve a pedir", async () => {
    listarMisCompras.mockRejectedValueOnce(new Error("red"));
    await renderConProviders(<MisCompras />, { usuario: ANA });
    expect(await screen.findByText("No pudimos conectar con el servidor")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByTestId("compra-7");
  });
});

import { act, fireEvent, screen } from "@testing-library/react-native";
import { router, useFocusEffect } from "expo-router";
import Favoritos from "./Favoritos";
import { listarFavoritos } from "../../api/favoritosApi";
import { renderConProviders, ANA } from "../../test-utils/renderConProviders";
import { errorHttp, eventoResumen } from "../../test-utils/fixtures";

jest.mock("../../api/favoritosApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const PIOJOS = eventoResumen({ id: 1, esFavorito: true });
const DIVIDIDOS = eventoResumen({ id: 2, nombre: "Divididos en Obras", esFavorito: true });
const enfocar = () => act(() => useFocusEffect.mock.calls.at(-1)[0]());

async function abrir() {
  await renderConProviders(<Favoritos />, { usuario: ANA });
  await screen.findByTestId("tarjeta-evento-1");
}

beforeEach(() => {
  jest.clearAllMocks();
  listarFavoritos.mockResolvedValue([DIVIDIDOS, PIOJOS]);
});

describe("Favoritos", () => {
  it("muestra los favoritos en el orden del back", async () => {
    await abrir();
    const tarjetas = screen.getAllByTestId(/^tarjeta-evento-\d+$/);
    expect(tarjetas.map((t) => t.props.testID)).toEqual(["tarjeta-evento-2", "tarjeta-evento-1"]);
    expect(screen.getByText("Divididos en Obras")).toBeTruthy();
  });

  it("tocar una tarjeta abre el detalle del evento", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("tarjeta-evento-2"));
    expect(router.push).toHaveBeenCalledWith("/eventos/2");
  });

  it("al recuperar el foco vuelve a pedir la lista", async () => {
    await abrir();
    await enfocar();
    expect(listarFavoritos).toHaveBeenCalledTimes(1);
    listarFavoritos.mockResolvedValue([PIOJOS]);
    await enfocar();
    expect(listarFavoritos).toHaveBeenCalledTimes(2);
    await screen.findByTestId("tarjeta-evento-1");
    expect(screen.queryByTestId("tarjeta-evento-2")).toBeNull();
  });

  it("sin favoritos invita a explorar eventos", async () => {
    listarFavoritos.mockResolvedValue([]);
    await renderConProviders(<Favoritos />, { usuario: ANA });
    expect(await screen.findByTestId("sin-favoritos")).toHaveTextContent(
      /Todavía no guardaste eventos/,
    );
    await fireEvent.press(screen.getByTestId("ir-a-explorar"));
    expect(router.navigate).toHaveBeenCalledWith("/explorar");
  });

  it("si falla muestra el mensaje del back y Reintentar trae la lista", async () => {
    listarFavoritos.mockRejectedValueOnce(errorHttp(500, "Error interno del servidor"));
    await renderConProviders(<Favoritos />, { usuario: ANA });
    const reintentar = await screen.findByRole("button", { name: "Reintentar" });
    expect(screen.getByText("Error interno del servidor")).toBeTruthy();
    await fireEvent.press(reintentar);
    expect(await screen.findByTestId("tarjeta-evento-2")).toBeTruthy();
    expect(listarFavoritos).toHaveBeenCalledTimes(2);
  });

  it("no ofrece cargar más porque la lista no se pagina", async () => {
    await abrir();
    expect(screen.queryByTestId("cargar-mas")).toBeNull();
  });
});

import { act, fireEvent, screen } from "@testing-library/react-native";
import { router, useFocusEffect } from "expo-router";
import MisEventos from "./MisEventos";
import { listarMisEventos } from "../../api/organizadoresApi";
import { FENIX, renderConProviders } from "../../test-utils/renderConProviders";
import { eventoPropio, paginaDeEventos } from "../../test-utils/fixtures";

jest.mock("../../api/organizadoresApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const PASADO = eventoPropio({
  id: 4,
  nombre: "Rock en el Parque",
  fecha: "2026-09-01T23:00:00.000Z",
  vendidas: 150,
  cupo: 150,
  recaudado: 6000000,
});
const FUTURO = eventoPropio({ id: 1 });
const enfocar = () => act(() => useFocusEffect.mock.calls.at(-1)[0]());

async function abrir() {
  await renderConProviders(<MisEventos />, { usuario: FENIX });
  await screen.findByTestId("evento-propio-1");
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: new Date("2026-11-11T12:00:00.000Z"), advanceTimers: true });
  listarMisEventos.mockResolvedValue(paginaDeEventos([PASADO, FUTURO]));
});

afterEach(() => jest.useRealTimers());

describe("MisEventos: lista", () => {
  it("muestra cada evento con vendidas sobre cupo y lo recaudado", async () => {
    await abrir();
    expect(listarMisEventos).toHaveBeenCalledWith({ page: 1, limit: 10 });
    const futuro = screen.getByTestId("evento-propio-1");
    expect(futuro).toHaveTextContent(/Los Piojos en River/);
    expect(futuro).toHaveTextContent(/60 de 150 vendidas/);
    expect(futuro).toHaveTextContent(/Recaudado \$\s2\.700\.000/);
    expect(screen.getByTestId("evento-propio-4")).toHaveTextContent(/150 de 150 vendidas/);
  });

  it("marca Finalizado solo a los eventos que ya ocurrieron", async () => {
    await abrir();
    expect(screen.getByTestId("evento-propio-4")).toHaveTextContent(/Finalizado/);
    expect(screen.getByTestId("evento-propio-1")).not.toHaveTextContent(/Finalizado/);
  });

  it("tocar un evento abre sus compras", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("evento-propio-4"));
    expect(router.push).toHaveBeenCalledWith("/eventos/4/compras");
  });

  it("Cargar más pide la página siguiente", async () => {
    listarMisEventos
      .mockResolvedValueOnce(paginaDeEventos([FUTURO], { totalPages: 2 }))
      .mockResolvedValueOnce(paginaDeEventos([PASADO], { page: 2, totalPages: 2 }));
    await abrir();
    await fireEvent.press(screen.getByTestId("cargar-mas"));
    await screen.findByTestId("evento-propio-4");
    expect(listarMisEventos).toHaveBeenLastCalledWith({ page: 2, limit: 10 });
  });

  it("al recuperar el foco vuelve a pedir la lista", async () => {
    await abrir();
    await enfocar();
    listarMisEventos.mockResolvedValue(paginaDeEventos([eventoPropio({ id: 1, vendidas: 61 })]));
    await enfocar();
    expect(await screen.findByText(/61 de 150 vendidas/)).toBeTruthy();
    expect(listarMisEventos).toHaveBeenCalledTimes(2);
  });
});

describe("MisEventos: vacío y error", () => {
  it("sin eventos lo avisa", async () => {
    listarMisEventos.mockResolvedValue(paginaDeEventos([], { totalPages: 0 }));
    await renderConProviders(<MisEventos />, { usuario: FENIX });
    expect(await screen.findByTestId("sin-eventos-propios")).toHaveTextContent(
      /Todavía no publicaste eventos/,
    );
  });

  it("con error muestra el mensaje y Reintentar", async () => {
    listarMisEventos.mockRejectedValueOnce(new Error("red"));
    await renderConProviders(<MisEventos />, { usuario: FENIX });
    await fireEvent.press(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByTestId("evento-propio-1")).toBeTruthy();
  });
});

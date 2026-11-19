import { act, fireEvent, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { ESPACIO_FAB } from "../../tema/espaciado";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
  finalizado: true,
});
const FUTURO = eventoPropio({ id: 1 });
const enfocar = () => act(() => useFocusEffect.mock.calls.at(-1)[0]());

async function abrir() {
  await renderConProviders(<MisEventos />, { usuario: FENIX });
  await screen.findByTestId("evento-propio-1");
}

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({});
  jest.useFakeTimers({ now: new Date("2026-11-11T12:00:00.000Z"), advanceTimers: true });
  listarMisEventos.mockResolvedValue(paginaDeEventos([PASADO, FUTURO]));
});

afterEach(() => jest.useRealTimers());

describe("MisEventos: resumen", () => {
  it("muestra recaudado y vendidas de todos los eventos que manda el back", async () => {
    listarMisEventos.mockResolvedValue({
      ...paginaDeEventos([PASADO, FUTURO]),
      resumen: { recaudado: 1845000, vendidas: 142 },
    });
    await renderConProviders(<MisEventos />, { usuario: FENIX });
    expect(await screen.findByTestId("resumen-recaudado")).toHaveTextContent(/\$\s1\.845\.000/);
    expect(screen.getByTestId("resumen-vendidas")).toHaveTextContent(/142/);
    expect(screen.getByText("Hola, Fénix Producciones")).toBeTruthy();
  });
});

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

  it("cada tarjeta se anuncia con su contenido para lectores de pantalla", async () => {
    await abrir();
    expect(
      screen.getByLabelText(
        /^Los Piojos en River, .+, Estadio River Plate, 60 de 150 vendidas, recaudado \$\s2\.700\.000$/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        /^Rock en el Parque, .+, 150 de 150 vendidas, recaudado \$\s6\.000\.000, finalizado$/,
      ),
    ).toBeTruthy();
  });

  it("Finalizado sale del back y no de la fecha del dispositivo", async () => {
    listarMisEventos.mockResolvedValue(
      paginaDeEventos([
        eventoPropio({ id: 1, fecha: "2026-11-11T11:59:59.000Z", finalizado: false }),
      ]),
    );
    await abrir();
    expect(screen.getByTestId("evento-propio-1")).not.toHaveTextContent(/Finalizado/);
  });

  it("la lista arranca debajo del encabezado y cierra el teclado al deslizar", async () => {
    await abrir();
    const { props } = screen.getByTestId("lista-mis-eventos");
    expect(props.contentInsetAdjustmentBehavior).toBe("automatic");
    expect(props.keyboardDismissMode).toBe("on-drag");
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

describe("MisEventos: nuevo evento", () => {
  it("el botón Nuevo evento abre el formulario", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("fab-nuevo-evento"));
    expect(router.push).toHaveBeenCalledWith("/eventos/nuevo");
  });

  it("la lista deja lugar abajo para que el botón no tape la última tarjeta", async () => {
    await abrir();
    expect(ESPACIO_FAB).toBeGreaterThan(0);
    const { contentContainerStyle } = screen.getByTestId("lista-mis-eventos").props;
    expect(StyleSheet.flatten(contentContainerStyle).paddingBottom).toBe(ESPACIO_FAB);
  });

  it("también aparece sin eventos", async () => {
    listarMisEventos.mockResolvedValue(paginaDeEventos([], { totalPages: 0 }));
    await renderConProviders(<MisEventos />, { usuario: FENIX });
    await screen.findByTestId("sin-eventos-propios");
    expect(screen.getByTestId("fab-nuevo-evento")).toBeTruthy();
  });

  it("al volver de publicar muestra el aviso y lo limpia al cerrarse", async () => {
    useLocalSearchParams.mockReturnValue({ aviso: "evento-creado" });
    await abrir();
    expect(screen.getByTestId("mis-eventos-aviso")).toHaveTextContent("Evento publicado");
    await act(async () => jest.advanceTimersByTime(10000));
    expect(router.setParams).toHaveBeenCalledWith({ aviso: undefined });
  });
});

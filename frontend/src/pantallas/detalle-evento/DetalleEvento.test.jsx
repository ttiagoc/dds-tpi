import { screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import DetalleEvento from "./DetalleEvento";
import { obtenerEvento } from "../../api/eventosApi";
import { obtenerReseniasDeOrganizador } from "../../api/organizadoresApi";
import { agregarFavorito, quitarFavorito } from "../../api/favoritosApi";
import { renderConProviders, ANA, FENIX } from "../../test-utils/renderConProviders";
import {
  errorHttp,
  eventoDetalle,
  promesaManual,
  resenia,
  reseniasDe,
} from "../../test-utils/fixtures";

jest.mock("../../api/eventosApi");
jest.mock("../../api/organizadoresApi");
jest.mock("../../api/favoritosApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const RESENIAS = [
  resenia({ id: 1, detalle: "Impecable", comprador: { nombre: "Bruno" } }),
  resenia({ id: 2, puntuacion: 4, detalle: "Muy bueno", comprador: { nombre: "Ana" } }),
];

async function abrir({ usuario = ANA } = {}) {
  await renderConProviders(<DetalleEvento />, { usuario });
  await screen.findByText("La vuelta de Los Piojos al Monumental.");
}

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({ id: "1" });
  obtenerEvento.mockResolvedValue(eventoDetalle());
  obtenerReseniasDeOrganizador.mockResolvedValue(reseniasDe(RESENIAS));
  agregarFavorito.mockResolvedValue();
  quitarFavorito.mockResolvedValue();
});

describe("DetalleEvento: datos", () => {
  it("muestra los datos del evento y los tipos con lo que queda", async () => {
    await abrir();
    expect(obtenerEvento).toHaveBeenCalledWith("1");
    expect(screen.getByText("Los Piojos en River")).toBeTruthy();
    expect(screen.getByText("RECITALES")).toBeTruthy();
    expect(screen.getByText(/Estadio River Plate/)).toBeTruthy();
    expect(screen.getByTestId("tipo-entrada-10")).toHaveTextContent(/Campo/);
    expect(screen.getByTestId("tipo-entrada-10")).toHaveTextContent(/Quedan 40/);
    expect(screen.getByTestId("tipo-entrada-11")).toHaveTextContent(/Agotado/);
  });

  it("muestra el promedio del organizador y sus últimas 3 reseñas", async () => {
    await abrir();
    expect(obtenerReseniasDeOrganizador).toHaveBeenCalledWith(2, { limit: 3 });
    const seccion = await screen.findByTestId("resenias-organizador");
    expect(seccion).toHaveTextContent(/4,5 · 12 reseñas/);
    expect(screen.getByTestId("resenia-1")).toHaveTextContent(/Impecable/);
    expect(screen.getByTestId("resenia-1")).toHaveTextContent(/Bruno/);
    expect(screen.getByTestId("resenia-2")).toHaveTextContent(/Muy bueno/);
  });

  it("organizador sin reseñas", async () => {
    obtenerReseniasDeOrganizador.mockResolvedValue(
      reseniasDe([], { puntajePromedio: null, cantidadResenias: 0 }),
    );
    await abrir();
    expect(await screen.findByText("Este organizador todavía no tiene reseñas")).toBeTruthy();
  });

  it("si fallan las reseñas el resto del detalle se ve y se puede reintentar", async () => {
    obtenerReseniasDeOrganizador
      .mockRejectedValueOnce(errorHttp(404, "No existe el organizador"))
      .mockResolvedValueOnce(reseniasDe(RESENIAS));
    await abrir();
    expect(await screen.findByText("No existe el organizador")).toBeTruthy();
    expect(screen.getByTestId("evento-comprar")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByTestId("resenia-1");
  });
});

describe("DetalleEvento: favorito", () => {
  it("marca y desmarca el favorito al instante", async () => {
    await abrir();
    const corazon = () => screen.getByTestId("evento-favorito");
    expect(screen.getByLabelText("Agregar a favoritos")).toBeTruthy();
    await fireEvent.press(corazon());
    expect(screen.getByLabelText("Quitar de favoritos")).toBeTruthy();
    expect(agregarFavorito).toHaveBeenCalledWith(1);
    await fireEvent.press(corazon());
    expect(screen.getByLabelText("Agregar a favoritos")).toBeTruthy();
    expect(quitarFavorito).toHaveBeenCalledWith(1);
  });

  it("si falla quitar el favorito vuelve a quedar marcado", async () => {
    obtenerEvento.mockResolvedValue(eventoDetalle({ esFavorito: true }));
    quitarFavorito.mockRejectedValue(errorHttp(500, "Error interno"));
    await abrir();
    await fireEvent.press(screen.getByTestId("evento-favorito"));
    expect(quitarFavorito).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Error interno")).toBeTruthy();
    expect(screen.getByLabelText("Quitar de favoritos")).toBeTruthy();
  });

  it("arranca marcado si el evento ya es favorito", async () => {
    obtenerEvento.mockResolvedValue(eventoDetalle({ esFavorito: true }));
    await abrir();
    expect(screen.getByLabelText("Quitar de favoritos")).toBeTruthy();
  });

  it("si falla vuelve al estado anterior y avisa con el mensaje del back", async () => {
    agregarFavorito.mockRejectedValue(errorHttp(404, "No existe el evento"));
    await abrir();
    await fireEvent.press(screen.getByTestId("evento-favorito"));
    expect(await screen.findByText("No existe el evento")).toBeTruthy();
    expect(screen.getByLabelText("Agregar a favoritos")).toBeTruthy();
  });

  it("mientras viaja el pedido ignora otro toque", async () => {
    const pedido = promesaManual();
    agregarFavorito.mockReturnValue(pedido.promesa);
    await abrir();
    await fireEvent.press(screen.getByTestId("evento-favorito"));
    await fireEvent.press(screen.getByTestId("evento-favorito"));
    expect(agregarFavorito).toHaveBeenCalledTimes(1);
    expect(quitarFavorito).not.toHaveBeenCalled();
    await act(() => pedido.resolver());
  });
});

describe("DetalleEvento: comprar y permisos", () => {
  it("el comprador ve la barra inferior con el precio desde", async () => {
    await abrir();
    expect(screen.getByTestId("evento-barra-comprar")).toHaveTextContent(/Desde\s*\$\s45\.000/);
  });

  it("el organizador no ve la barra de compra", async () => {
    await abrir({ usuario: FENIX });
    expect(screen.queryByTestId("evento-barra-comprar")).toBeNull();
  });

  it("Comprar lleva a la pantalla de compra", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("evento-comprar"));
    expect(router.push).toHaveBeenCalledWith("/eventos/1/comprar");
  });

  it("con todo agotado el botón dice Agotado y está deshabilitado", async () => {
    const agotado = eventoDetalle();
    agotado.tiposEntrada = agotado.tiposEntrada.map((t) => ({ ...t, disponibles: 0 }));
    obtenerEvento.mockResolvedValue(agotado);
    await abrir();
    expect(screen.getByTestId("evento-comprar")).toBeDisabled();
    expect(screen.getByTestId("evento-comprar")).toHaveTextContent("Agotado");
    expect(screen.getByTestId("tipo-entrada-10")).toHaveTextContent(/Agotado/);
    expect(screen.getByTestId("tipo-entrada-11")).toHaveTextContent(/Agotado/);
    expect(screen.queryByText(/Quedan/)).toBeNull();
  });

  it("en un evento finalizado no ofrece comprar", async () => {
    obtenerEvento.mockResolvedValue(eventoDetalle({ finalizado: true }));
    await abrir();
    expect(screen.queryByTestId("evento-comprar")).toBeNull();
    expect(screen.getByTestId("evento-finalizado")).toBeDisabled();
    expect(screen.getByTestId("evento-finalizado")).toHaveTextContent(/Evento finalizado/);
  });

  it("al volver a la pantalla recarga el evento con lo que queda", async () => {
    await abrir();
    const enfocar = () => act(() => useFocusEffect.mock.calls.at(-1)[0]());
    await enfocar();
    const sinCampo = eventoDetalle();
    sinCampo.tiposEntrada = sinCampo.tiposEntrada.map((t) => ({ ...t, disponibles: 0 }));
    obtenerEvento.mockResolvedValue(sinCampo);
    await enfocar();
    await waitFor(() => expect(screen.getByTestId("evento-comprar")).toHaveTextContent("Agotado"));
    expect(obtenerEvento).toHaveBeenCalledTimes(2);
  });

  it("un organizador no ve el favorito ni Comprar", async () => {
    await abrir({ usuario: FENIX });
    expect(screen.queryByTestId("evento-favorito")).toBeNull();
    expect(screen.queryByTestId("evento-comprar")).toBeNull();
  });
});

describe("DetalleEvento: errores", () => {
  it("un evento inexistente muestra el mensaje y Volver", async () => {
    obtenerEvento.mockRejectedValue(errorHttp(404, "No existe el evento"));
    router.canGoBack.mockReturnValue(true);
    await renderConProviders(<DetalleEvento />, { usuario: ANA });
    expect(await screen.findByText("No existe el evento")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Volver" }));
    expect(router.back).toHaveBeenCalled();
  });

  it("Volver sin historial va al inicio", async () => {
    obtenerEvento.mockRejectedValue(errorHttp(404, "No existe el evento"));
    router.canGoBack.mockReturnValue(false);
    await renderConProviders(<DetalleEvento />, { usuario: ANA });
    await fireEvent.press(await screen.findByRole("button", { name: "Volver" }));
    expect(router.replace).toHaveBeenCalledWith("/");
  });

  it("otro error muestra Reintentar", async () => {
    obtenerEvento.mockRejectedValueOnce(new Error("red"));
    await renderConProviders(<DetalleEvento />, { usuario: ANA });
    expect(await screen.findByText("No pudimos conectar con el servidor")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByText("La vuelta de Los Piojos al Monumental.");
    await waitFor(() => expect(obtenerEvento).toHaveBeenCalledTimes(2));
  });
});

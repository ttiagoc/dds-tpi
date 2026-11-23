import { act, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { ultimoSocket } from "socket.io-client";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Brightness from "expo-brightness";
import DetalleCompra from "./DetalleCompra";
import { obtenerCompra } from "../../api/comprasApi";
import { renderConProviders, ANA, FENIX } from "../../test-utils/renderConProviders";
import { compraDetalle, errorHttp, resenia } from "../../test-utils/fixtures";
import {
  REEMBOLSADA,
  SIN_ACCIONES,
  abrirDetalleCompra as abrir,
} from "../../test-utils/detalleCompra";

jest.mock("../../api/comprasApi");
jest.mock("expo-brightness", () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  getBrightnessAsync: jest.fn(() => Promise.resolve(0.5)),
  setBrightnessAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

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
    expect(screen.queryByRole("button", { name: /Pagar|Cancelar|Reseñar/ })).toBeNull();
    expect(screen.getByTestId("compra-chat")).toBeTruthy();
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

const UTILIZADA = compraDetalle({
  estado: "UTILIZADA",
  diasRestantes: null,
  acciones: { ...SIN_ACCIONES, puedeReseniar: true },
});

const RESENIADA = {
  ...UTILIZADA,
  acciones: SIN_ACCIONES,
  resenia: resenia({ puntuacion: 4, detalle: "Buen sonido" }),
};

const enfocar = () => act(() => useFocusEffect.mock.calls.at(-1)[0]());

describe("DetalleCompra: reseña", () => {
  afterEach(() => jest.useRealTimers());

  it.each([
    [true, true],
    [false, false],
  ])("con puedeReseniar %s el botón Reseñar se ve: %s", async (puede, seVe) => {
    obtenerCompra.mockResolvedValue({
      ...UTILIZADA,
      acciones: { ...SIN_ACCIONES, puedeReseniar: puede },
    });
    await abrir();
    expect(!!screen.queryByTestId("compra-resenar")).toBe(seVe);
  });

  it("Reseñar abre la pantalla de reseña de la compra", async () => {
    obtenerCompra.mockResolvedValue(UTILIZADA);
    await abrir();
    await fireEvent.press(screen.getByTestId("compra-resenar"));
    expect(router.push).toHaveBeenCalledWith("/compras/7/resenia");
  });

  it("muestra Tu reseña con las estrellas y el comentario", async () => {
    obtenerCompra.mockResolvedValue(RESENIADA);
    await abrir();
    const seccion = screen.getByTestId("compra-resenia");
    expect(seccion).toHaveTextContent(/Tu reseña/);
    expect(seccion).toHaveTextContent(/Buen sonido/);
    expect(screen.getByLabelText("Puntaje 4 de 5")).toBeTruthy();
  });

  it("sin reseña no muestra la sección", async () => {
    obtenerCompra.mockResolvedValue(UTILIZADA);
    await abrir();
    expect(screen.queryByTestId("compra-resenia")).toBeNull();
  });

  it("al volver de reseñar recarga, muestra la reseña y el aviso", async () => {
    obtenerCompra.mockResolvedValue(UTILIZADA);
    await abrir();
    await enfocar();
    expect(obtenerCompra).toHaveBeenCalledTimes(1);
    obtenerCompra.mockResolvedValue(RESENIADA);
    useLocalSearchParams.mockReturnValue({ id: "7", aviso: "resenia" });
    await enfocar();
    expect(await screen.findByTestId("compra-resenia")).toHaveTextContent(/Buen sonido/);
    expect(obtenerCompra).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("compra-resenar")).toBeNull();
    expect(screen.getByTestId("compra-aviso")).toHaveTextContent("¡Gracias por tu reseña!");
  });

  it("cuando el aviso de la reseña se cierra limpia el parámetro", async () => {
    jest.useFakeTimers();
    useLocalSearchParams.mockReturnValue({ id: "7", aviso: "resenia" });
    obtenerCompra.mockResolvedValue(RESENIADA);
    await abrir();
    expect(screen.getByTestId("compra-aviso")).toHaveTextContent("¡Gracias por tu reseña!");
    await act(async () => jest.advanceTimersByTime(10000));
    expect(router.setParams).toHaveBeenCalledWith({ aviso: undefined });
  });
});

describe("DetalleCompra: reseña según el rol", () => {
  it.each([
    ["el comprador", ANA, "Tu reseña"],
    ["el organizador", FENIX, "Reseña del comprador"],
  ])("para %s la sección se titula como corresponde", async (_, usuario, titulo) => {
    obtenerCompra.mockResolvedValue(RESENIADA);
    await abrir(usuario);
    expect(screen.getByTestId("compra-resenia")).toHaveTextContent(new RegExp(`^${titulo}`));
  });
});

describe("DetalleCompra: QR de la entrada", () => {
  it("el comprador abre el QR en un modal con el brillo al máximo y lo cierra", async () => {
    await abrir();
    expect(screen.queryByTestId("compra-qr")).toBeNull();
    expect(screen.queryByTestId("compra-qr-pendiente")).toBeNull();
    await fireEvent.press(screen.getByTestId("compra-ver-qr"));
    expect(screen.getByTestId("compra-qr")).toHaveTextContent(/Mostrá este código en la entrada/);
    expect(screen.getByLabelText("Código QR de la compra 7")).toBeTruthy();
    await waitFor(() => expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(1));
    await fireEvent.press(screen.getByTestId("compra-qr-cerrar"));
    await waitFor(() => expect(screen.queryByTestId("compra-qr")).toBeNull());
    expect(Brightness.setBrightnessAsync).toHaveBeenLastCalledWith(0.5);
  });

  it("con la compra pendiente avisa que hay que pagarla", async () => {
    obtenerCompra.mockResolvedValue(compraDetalle({ estado: "PENDIENTE" }));
    await abrir();
    expect(screen.getByTestId("compra-qr-pendiente")).toHaveTextContent(
      /Pagá la compra para ver tu entrada/,
    );
    expect(screen.queryByTestId("compra-ver-qr")).toBeNull();
  });

  it.each([["UTILIZADA"], ["CANCELADA"], ["REEMBOLSADA"]])(
    "en %s no muestra nada",
    async (estado) => {
      obtenerCompra.mockResolvedValue(compraDetalle({ estado, diasRestantes: null }));
      await abrir();
      expect(screen.queryByTestId("compra-ver-qr")).toBeNull();
      expect(screen.queryByTestId("compra-qr-pendiente")).toBeNull();
    },
  );

  it("el organizador no ve el botón del QR", async () => {
    await abrir(FENIX);
    expect(screen.queryByTestId("compra-ver-qr")).toBeNull();
  });
});

const llegaEstado = (estado) =>
  act(async () => ultimoSocket().simular("compra:estado", { compraId: 7, estado }));

describe("DetalleCompra: estado en vivo", () => {
  it("se une al room de la compra", async () => {
    await abrir();
    await act(async () => ultimoSocket().simular("connect"));
    expect(ultimoSocket().emit).toHaveBeenCalledWith(
      "compra:unirse",
      { compraId: 7 },
      expect.any(Function),
    );
  });

  it("si llega un estado distinto vuelve a pedir la compra y lo muestra", async () => {
    await abrir();
    obtenerCompra.mockResolvedValue(UTILIZADA);
    await llegaEstado("UTILIZADA");
    await waitFor(() => expect(screen.getByTestId("compra-estado")).toHaveTextContent(/Utilizada/));
    expect(obtenerCompra).toHaveBeenCalledTimes(2);
  });

  it("si llega el mismo estado que muestra no vuelve a pedir", async () => {
    await abrir();
    await llegaEstado("CONFIRMADA");
    expect(obtenerCompra).toHaveBeenCalledTimes(1);
  });
});

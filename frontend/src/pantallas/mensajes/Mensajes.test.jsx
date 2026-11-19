import { act, fireEvent, screen } from "@testing-library/react-native";
import { router, useFocusEffect } from "expo-router";
import Mensajes from "./Mensajes";
import { listarConversaciones } from "../../api/conversacionesApi";
import { ANA, renderConProviders } from "../../test-utils/renderConProviders";
import {
  conversacionResumen,
  errorHttp,
  mensaje,
  paginaDeConversaciones,
} from "../../test-utils/fixtures";

jest.mock("../../api/conversacionesApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const SIN_LEER = conversacionResumen({ compraId: 7, noLeidos: 2 });
const LEIDA = conversacionResumen({
  compraId: 9,
  noLeidos: 0,
  contraparte: { id: 2, nombre: "Konex" },
  ultimoMensaje: mensaje({ id: 4, usuario: { id: 3, nombre: "Ana Pérez", rol: "COMPRADOR" } }),
});

async function abrir() {
  await renderConProviders(<Mensajes />, { usuario: ANA });
  await screen.findByTestId("conversacion-7");
}

beforeEach(() => {
  jest.clearAllMocks();
  listarConversaciones.mockResolvedValue(paginaDeConversaciones([SIN_LEER, LEIDA]));
});

describe("Mensajes", () => {
  it("lista las conversaciones en el orden del back, de a 10", async () => {
    await abrir();
    expect(listarConversaciones).toHaveBeenCalledWith({ page: 1, limit: 10 });
    const filas = screen.getAllByTestId(/^conversacion-\d+$/);
    expect(filas.map((f) => f.props.testID)).toEqual(["conversacion-7", "conversacion-9"]);
  });

  it("muestra contraparte, evento con número de compra, último mensaje y no leídos", async () => {
    await abrir();
    const fila = screen.getByTestId("conversacion-7");
    expect(fila).toHaveTextContent(/Fénix Producciones/);
    expect(fila).toHaveTextContent(/Los Piojos en River · #7/);
    expect(fila).toHaveTextContent(/Abrimos a las 17 h/);
    expect(screen.getByTestId("no-leidos-7")).toHaveTextContent("2");
    expect(screen.queryByTestId("no-leidos-9")).toBeNull();
  });

  it("si el último mensaje es propio lo antepone con Vos", async () => {
    await abrir();
    expect(screen.getByTestId("conversacion-9")).toHaveTextContent(/Vos: /);
  });

  it("tocar una conversación abre el chat de esa compra", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("conversacion-9"));
    expect(router.push).toHaveBeenCalledWith("/compras/9/chat");
  });

  it("sin conversaciones muestra el vacío", async () => {
    listarConversaciones.mockResolvedValue(paginaDeConversaciones([]));
    await renderConProviders(<Mensajes />, { usuario: ANA });
    expect(await screen.findByTestId("sin-conversaciones")).toHaveTextContent(
      /Todavía no tenés mensajes/,
    );
  });

  it("si falla muestra el error del back y Reintentar vuelve a pedir", async () => {
    listarConversaciones.mockRejectedValueOnce(errorHttp(500, "Se rompió"));
    await renderConProviders(<Mensajes />, { usuario: ANA });
    await fireEvent.press(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByTestId("conversacion-7")).toBeTruthy();
  });

  it("al volver a la pantalla recarga", async () => {
    await abrir();
    await act(() => useFocusEffect.mock.calls.at(-1)[0]());
    await act(() => useFocusEffect.mock.calls.at(-1)[0]());
    expect(listarConversaciones).toHaveBeenCalledTimes(2);
  });
});

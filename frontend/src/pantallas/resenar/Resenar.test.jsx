import { act, fireEvent, screen } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { obtenerCompra, reseniarCompra } from "../../api/comprasApi";
import { compraDetalle, errorHttp, promesaManual, resenia } from "../../test-utils/fixtures";
import { ANA, renderConProviders } from "../../test-utils/renderConProviders";
import Resenar from "./Resenar";

jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());
jest.mock("../../api/comprasApi");

const UTILIZADA = compraDetalle({
  estado: "UTILIZADA",
  diasRestantes: null,
  acciones: {
    puedePagar: false,
    puedeCancelar: false,
    puedeMarcarUtilizada: false,
    puedeReseniar: true,
  },
});

const enviar = () => screen.getByTestId("resenia-enviar");

async function abrir() {
  await renderConProviders(<Resenar />, { usuario: ANA });
  await screen.findByTestId("resenia-detalle");
}

async function completar(puntuacion, detalle) {
  await fireEvent.press(screen.getByTestId(`estrella-${puntuacion}`));
  await fireEvent.changeText(screen.getByTestId("resenia-detalle"), detalle);
}

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({ id: "7" });
  obtenerCompra.mockResolvedValue(UTILIZADA);
  reseniarCompra.mockResolvedValue(resenia({ compraId: 7 }));
});

describe("Resenar: carga", () => {
  it("pide la compra de la ruta y muestra el evento con el formulario vacío", async () => {
    await abrir();
    expect(obtenerCompra).toHaveBeenCalledWith("7");
    expect(screen.getByText("Los Piojos en River")).toBeTruthy();
    expect(screen.queryAllByTestId(/estrella-llena/)).toHaveLength(0);
    expect(screen.getByText("0/500")).toBeTruthy();
  });

  it("si la compra no se puede reseñar muestra el aviso con Volver, sin formulario", async () => {
    obtenerCompra.mockResolvedValue(compraDetalle());
    await renderConProviders(<Resenar />, { usuario: ANA });
    expect(await screen.findByTestId("resenia-no-disponible")).toHaveTextContent(
      /Esta compra no se puede reseñar/,
    );
    expect(screen.getByTestId("volver")).toBeTruthy();
    expect(screen.queryByTestId("resenia-detalle")).toBeNull();
  });

  it("con 404 muestra el mensaje y Volver", async () => {
    obtenerCompra.mockRejectedValue(errorHttp(404, "No existe la compra"));
    await renderConProviders(<Resenar />, { usuario: ANA });
    expect(await screen.findByTestId("compra-inexistente")).toHaveTextContent(
      /No existe la compra/,
    );
  });
});

describe("Resenar: formulario", () => {
  it("Enviar queda deshabilitado sin puntuación o con el comentario en blanco", async () => {
    await abrir();
    expect(enviar()).toBeDisabled();
    await completar(4, "   ");
    expect(enviar()).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId("resenia-detalle"), "Muy bueno");
    expect(enviar()).toBeEnabled();
    expect(screen.getByText("9/500")).toBeTruthy();
  });

  it("sin puntuación no se habilita aunque haya comentario", async () => {
    await abrir();
    await fireEvent.changeText(screen.getByTestId("resenia-detalle"), "Muy bueno");
    expect(enviar()).toBeDisabled();
  });

  it("tocar una estrella pinta esa cantidad", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("estrella-4"));
    expect(screen.getAllByTestId(/estrella-llena/)).toHaveLength(4);
  });

  it("limita el comentario a 500 caracteres", async () => {
    await abrir();
    expect(screen.getByTestId("resenia-detalle")).toHaveProp("maxLength", 500);
  });
});

describe("Resenar: envío", () => {
  it("manda la puntuación y el comentario sin espacios y vuelve a la compra con aviso", async () => {
    await abrir();
    await completar(5, "  Excelente show  ");
    await fireEvent.press(enviar());
    expect(reseniarCompra).toHaveBeenCalledWith(7, { puntuacion: 5, detalle: "Excelente show" });
    expect(router.dismissTo).toHaveBeenCalledWith({
      pathname: "/compras/[id]",
      params: { id: "7", aviso: "resenia" },
    });
  });

  it("mientras envía muestra Enviar ocupado y un segundo toque no repite el pedido", async () => {
    const respuesta = promesaManual();
    reseniarCompra.mockReturnValue(respuesta.promesa);
    await abrir();
    await completar(5, "Excelente");
    await fireEvent.press(enviar());
    expect(enviar()).toBeDisabled();
    await fireEvent.press(enviar());
    expect(reseniarCompra).toHaveBeenCalledTimes(1);
    await act(async () => respuesta.resolver(resenia()));
    expect(router.dismissTo).toHaveBeenCalledTimes(1);
  });

  it.each([
    [409, "Ya reseñaste esta compra"],
    [422, "Solo podés reseñar una compra utilizada"],
  ])("con %i muestra el texto del back, conserva lo escrito y no recarga", async (status, msj) => {
    reseniarCompra.mockRejectedValue(errorHttp(status, msj));
    await abrir();
    await completar(3, "Regular");
    await fireEvent.press(enviar());
    expect(await screen.findByTestId("resenia-error")).toHaveTextContent(msj);
    expect(screen.getByTestId("resenia-detalle")).toHaveProp("value", "Regular");
    expect(screen.getAllByTestId(/estrella-llena/)).toHaveLength(3);
    expect(obtenerCompra).toHaveBeenCalledTimes(1);
    expect(router.dismissTo).not.toHaveBeenCalled();
  });

  it("el error se limpia al reintentar", async () => {
    reseniarCompra.mockRejectedValueOnce(new Error("red"));
    await abrir();
    await completar(3, "Regular");
    await fireEvent.press(enviar());
    await screen.findByTestId("resenia-error");
    await fireEvent.press(enviar());
    expect(screen.queryByTestId("resenia-error")).toBeNull();
    expect(router.dismissTo).toHaveBeenCalled();
  });
});

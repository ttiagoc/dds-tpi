import { screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import Comprar from "./Comprar";
import { obtenerEvento } from "../../api/eventosApi";
import { crearCompra } from "../../api/comprasApi";
import { renderConProviders, ANA } from "../../test-utils/renderConProviders";
import { errorHttp, eventoDetalle, promesaManual } from "../../test-utils/fixtures";

jest.mock("../../api/eventosApi");
jest.mock("../../api/comprasApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const CAMPO = {
  id: 10,
  nombre: "Campo",
  descripcion: "",
  precio: 45000,
  cupo: 100,
  disponibles: 40,
};
const PLATEA = {
  id: 11,
  nombre: "Platea",
  descripcion: "",
  precio: 80000,
  cupo: 50,
  disponibles: 0,
};
const VIP = { id: 12, nombre: "VIP", descripcion: "", precio: 120000, cupo: 10, disponibles: 3 };

const conTipos = (...tiposEntrada) => eventoDetalle({ tiposEntrada });
const valor = () => screen.getByTestId("cantidad-valor");
const sumar = () => fireEvent.press(screen.getByTestId("cantidad-mas"));
const restar = () => fireEvent.press(screen.getByTestId("cantidad-menos"));
const confirmar = () => fireEvent.press(screen.getByTestId("comprar-confirmar"));
const elegir = (tipo) => fireEvent.press(screen.getByTestId(`tipo-${tipo.id}`));
const elegido = (tipo) => screen.getByTestId(`tipo-${tipo.id}`).props.accessibilityState?.checked;

async function abrir() {
  await renderConProviders(<Comprar />, { usuario: ANA });
  await screen.findByTestId("comprar-confirmar");
}

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({ id: "1" });
  obtenerEvento.mockResolvedValue(conTipos(PLATEA, CAMPO, VIP));
  crearCompra.mockResolvedValue({ id: 77, estado: "PENDIENTE" });
});

describe("Comprar: elegir tipo y cantidad", () => {
  it("muestra el evento y preselecciona el primer tipo con disponibles", async () => {
    await abrir();
    expect(obtenerEvento).toHaveBeenCalledWith("1");
    expect(screen.getByText("Los Piojos en River")).toBeTruthy();
    expect(elegido(CAMPO)).toBe(true);
    expect(valor()).toHaveTextContent("1");
    expect(screen.getByTestId("comprar-total")).toHaveTextContent(/Total: \$\s45\.000/);
  });

  it("un tipo agotado dice Agotado y no se puede elegir", async () => {
    await abrir();
    expect(screen.getByTestId("tipo-11")).toHaveTextContent(/Agotado/);
    expect(screen.getByTestId("tipo-11")).toBeDisabled();
    expect(screen.getByTestId("tipo-10")).toHaveTextContent(/Quedan 40/);
  });

  it("la cantidad va de 1 al tope de 10 y el total acompaña", async () => {
    await abrir();
    expect(screen.getByTestId("cantidad-menos")).toBeDisabled();
    for (let i = 0; i < 12; i++) await sumar();
    expect(valor()).toHaveTextContent("10");
    expect(screen.getByTestId("cantidad-mas")).toBeDisabled();
    expect(screen.getByTestId("comprar-total")).toHaveTextContent(/Total: \$\s450\.000/);
    await restar();
    expect(valor()).toHaveTextContent("9");
  });

  it("el tope es lo disponible y al cambiar de tipo la cantidad baja", async () => {
    await abrir();
    for (let i = 0; i < 5; i++) await sumar();
    await elegir(VIP);
    expect(elegido(VIP)).toBe(true);
    expect(valor()).toHaveTextContent("3");
    expect(screen.getByTestId("cantidad-mas")).toBeDisabled();
    expect(screen.getByTestId("comprar-total")).toHaveTextContent(/Total: \$\s360\.000/);
  });
});

describe("Comprar: confirmar", () => {
  it("crea la compra y reemplaza la pantalla por la compra creada", async () => {
    await abrir();
    await sumar();
    await confirmar();
    expect(crearCompra).toHaveBeenCalledWith({ eventoId: 1, tipoEntradaId: 10, cantidad: 2 });
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/compras/77"));
  });

  it("mientras viaja el pedido queda en loading e ignora otro toque", async () => {
    const pedido = promesaManual();
    crearCompra.mockReturnValue(pedido.promesa);
    await abrir();
    await confirmar();
    await confirmar();
    expect(crearCompra).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("comprar-confirmar")).toBeDisabled();
    await act(() => pedido.resolver({ id: 78 }));
    expect(router.replace).toHaveBeenCalledWith("/compras/78");
  });

  it("con un 422 muestra el mensaje, recarga el evento y ajusta la cantidad", async () => {
    crearCompra.mockRejectedValue(errorHttp(422, "No hay cupo suficiente para VIP"));
    obtenerEvento
      .mockResolvedValueOnce(conTipos(CAMPO, VIP))
      .mockResolvedValueOnce(conTipos(CAMPO, { ...VIP, disponibles: 2 }));
    await abrir();
    await elegir(VIP);
    for (let i = 0; i < 2; i++) await sumar();
    await confirmar();
    expect(await screen.findByText("No hay cupo suficiente para VIP")).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("tipo-12")).toHaveTextContent(/Quedan 2/));
    expect(obtenerEvento).toHaveBeenCalledTimes(2);
    expect(elegido(VIP)).toBe(true);
    expect(valor()).toHaveTextContent("2");
  });

  it("si el tipo elegido se agotó, pasa al primero con disponibles", async () => {
    crearCompra.mockRejectedValue(errorHttp(422, "No hay cupo suficiente para VIP"));
    obtenerEvento
      .mockResolvedValueOnce(conTipos(CAMPO, VIP))
      .mockResolvedValueOnce(conTipos(CAMPO, { ...VIP, disponibles: 0 }));
    await abrir();
    await elegir(VIP);
    await confirmar();
    await waitFor(() => expect(screen.getByTestId("tipo-12")).toHaveTextContent(/Agotado/));
    expect(elegido(CAMPO)).toBe(true);
  });

  it("con un error de red muestra el mensaje y conserva lo elegido", async () => {
    crearCompra.mockRejectedValue(new Error("red"));
    await abrir();
    await elegir(VIP);
    await sumar();
    await confirmar();
    expect(await screen.findByTestId("comprar-error")).toHaveTextContent(
      "No pudimos conectar con el servidor",
    );
    expect(obtenerEvento).toHaveBeenCalledTimes(1);
    expect(elegido(VIP)).toBe(true);
    expect(valor()).toHaveTextContent("2");
    expect(screen.getByTestId("comprar-confirmar")).toBeEnabled();
  });
});

describe("Comprar: estados", () => {
  it("con todo agotado avisa que no quedan entradas y deja volver", async () => {
    obtenerEvento.mockResolvedValue(conTipos({ ...CAMPO, disponibles: 0 }, PLATEA));
    await renderConProviders(<Comprar />, { usuario: ANA });
    expect(await screen.findByTestId("sin-entradas")).toHaveTextContent(
      /No quedan entradas para este evento/,
    );
    expect(screen.queryByTestId("comprar-confirmar")).toBeNull();
    expect(screen.getByRole("button", { name: "Volver" })).toBeTruthy();
  });

  it("un evento inexistente muestra el mensaje con Volver", async () => {
    obtenerEvento.mockRejectedValue(errorHttp(404, "No existe el evento"));
    await renderConProviders(<Comprar />, { usuario: ANA });
    expect(await screen.findByTestId("evento-inexistente")).toHaveTextContent(
      /No existe el evento/,
    );
    expect(screen.getByTestId("volver")).toBeTruthy();
  });

  it("otro error de carga muestra Reintentar", async () => {
    obtenerEvento.mockRejectedValueOnce(new Error("red"));
    await renderConProviders(<Comprar />, { usuario: ANA });
    await fireEvent.press(await screen.findByRole("button", { name: "Reintentar" }));
    await screen.findByTestId("comprar-confirmar");
  });
});

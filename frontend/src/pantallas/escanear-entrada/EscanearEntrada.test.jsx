import { act, fireEvent, screen } from "@testing-library/react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { Linking } from "react-native";
import EscanearEntrada from "./EscanearEntrada";
import { obtenerCompra, validarEntrada } from "../../api/comprasApi";
import { FENIX, renderConProviders } from "../../test-utils/renderConProviders";
import { compraDetalle, entrada, errorHttp } from "../../test-utils/fixtures";

jest.mock("../../api/comprasApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());
jest.mock("expo-camera", () => {
  const { createElement } = require("react");
  const { View } = require("react-native");
  return {
    CameraView: jest.fn((props) => createElement(View, { testID: props.testID })),
    useCameraPermissions: jest.fn(),
  };
});

const pedirPermiso = jest.fn();
const USADA = { fechaUso: "2026-11-20T22:00:00.000Z" };
const PARA_VALIDAR = compraDetalle({
  cantidad: 3,
  entradas: [
    entrada(1, { puedeValidarse: true }),
    entrada(2, { puedeValidarse: true }),
    entrada(3),
  ],
});
const conEntradas = (estado, entradas) => compraDetalle({ estado, cantidad: 3, entradas });

const conPermiso = (permiso) => useCameraPermissions.mockReturnValue([permiso, pedirPermiso]);
const camara = () => CameraView.mock.calls.at(-1)[0];
const escanear = (data) => act(async () => camara().onBarcodeScanned({ type: "qr", data }));
const QR_ENTRADA_2 = "aiticketit:compra:7:entrada:2";

async function abrir() {
  await renderConProviders(<EscanearEntrada />, { usuario: FENIX });
  await screen.findByTestId("escaner-camara");
}

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({ id: "1" });
  conPermiso({ granted: true, canAskAgain: true });
  obtenerCompra.mockResolvedValue(PARA_VALIDAR);
  validarEntrada.mockResolvedValue(
    conEntradas("UTILIZADA", [entrada(1), entrada(2, USADA), entrada(3)]),
  );
});

describe("EscanearEntrada: validar", () => {
  it("escanea solo QR y pide que apunte a la entrada", async () => {
    await abrir();
    expect(camara().barcodeScannerSettings).toEqual({ barcodeTypes: ["qr"] });
    expect(screen.getByText("Apuntá al QR de la entrada")).toBeTruthy();
  });

  it("lee la entrada, la valida y dice cuántas quedan", async () => {
    await abrir();
    await escanear(QR_ENTRADA_2);
    expect(obtenerCompra).toHaveBeenCalledWith(7);
    const resultado = screen.getByTestId("escaner-resultado");
    expect(resultado).toHaveTextContent(/Ana Pérez/);
    expect(resultado).toHaveTextContent(/Entrada 2 de 3 · Campo/);
    expect(camara().onBarcodeScanned).toBeUndefined();
    await fireEvent.press(screen.getByTestId("escaner-validar"));
    expect(validarEntrada).toHaveBeenCalledWith(7, 2);
    expect(await screen.findByTestId("escaner-validada")).toHaveTextContent(/Entrada validada/);
    expect(screen.getByTestId("escaner-quedan")).toHaveTextContent(
      "Quedan 2 entradas de esta compra",
    );
  });

  it.each([
    [[entrada(1, USADA), entrada(2, USADA), entrada(3)], "Queda 1 entrada de esta compra"],
    [[entrada(1, USADA), entrada(2, USADA), entrada(3, USADA)], null],
  ])("después de validar avisa lo que queda", async (entradas, texto) => {
    validarEntrada.mockResolvedValue(conEntradas("UTILIZADA", entradas));
    await abrir();
    await escanear(QR_ENTRADA_2);
    await fireEvent.press(screen.getByTestId("escaner-validar"));
    await screen.findByTestId("escaner-validada");
    if (texto) expect(screen.getByTestId("escaner-quedan")).toHaveTextContent(texto);
    else expect(screen.queryByTestId("escaner-quedan")).toBeNull();
  });

  it("Escanear otra vuelve a la cámara", async () => {
    await abrir();
    await escanear(QR_ENTRADA_2);
    await fireEvent.press(screen.getByTestId("escaner-otra"));
    expect(screen.getByText("Apuntá al QR de la entrada")).toBeTruthy();
    expect(camara().onBarcodeScanned).toEqual(expect.any(Function));
  });

  it("si el back rechaza la validación muestra su mensaje", async () => {
    validarEntrada.mockRejectedValue(errorHttp(422, "Esta entrada ya fue utilizada"));
    await abrir();
    await escanear(QR_ENTRADA_2);
    await fireEvent.press(screen.getByTestId("escaner-validar"));
    expect(await screen.findByTestId("escaner-error")).toHaveTextContent(
      "Esta entrada ya fue utilizada",
    );
  });
});

describe("EscanearEntrada: no se puede validar", () => {
  it.each([
    ["UTILIZADA", entrada(2, USADA), "Esta entrada ya fue utilizada"],
    ["PENDIENTE", entrada(2), "Esta compra todavía no está pagada"],
    ["CANCELADA", entrada(2), "Esta compra está cancelada"],
    ["REEMBOLSADA", entrada(2), "Esta compra está cancelada"],
  ])("con la compra %s avisa el motivo, sin botón", async (estado, segunda, motivo) => {
    obtenerCompra.mockResolvedValue(conEntradas(estado, [entrada(1), segunda, entrada(3)]));
    await abrir();
    await escanear(QR_ENTRADA_2);
    expect(screen.getByTestId("escaner-motivo")).toHaveTextContent(new RegExp(motivo));
    expect(screen.queryByTestId("escaner-validar")).toBeNull();
  });

  it("una entrada de otro evento no se puede validar", async () => {
    obtenerCompra.mockResolvedValue(compraDetalle({ evento: { id: 5, nombre: "Otro" } }));
    await abrir();
    await escanear(QR_ENTRADA_2);
    expect(screen.getByTestId("escaner-error")).toHaveTextContent(/Esa entrada es de otro evento/);
    expect(screen.queryByTestId("escaner-validar")).toBeNull();
  });

  it("un número de entrada que la compra no tiene avisa que no existe", async () => {
    await abrir();
    await escanear("aiticketit:compra:7:entrada:9");
    expect(screen.getByTestId("escaner-error")).toHaveTextContent(/No existe la entrada/);
  });

  it.each([["https://ejemplo.com"], ["aiticketit:compra:7"]])(
    "el QR %s no es de la app y no consulta al back",
    async (data) => {
      await abrir();
      await escanear(data);
      expect(screen.getByTestId("escaner-error")).toHaveTextContent(
        /Ese QR no es una entrada de AI Ticket It/,
      );
      expect(obtenerCompra).not.toHaveBeenCalled();
    },
  );

  it.each([
    [404, "No existe la compra"],
    [403, "No tenés permiso para realizar esta acción"],
  ])("con %i muestra el mensaje del back", async (status, mensaje) => {
    obtenerCompra.mockRejectedValue(errorHttp(status, mensaje));
    await abrir();
    await escanear(QR_ENTRADA_2);
    expect(screen.getByTestId("escaner-error")).toHaveTextContent(new RegExp(mensaje));
  });
});

describe("EscanearEntrada: permiso de cámara", () => {
  it("sin permiso lo pide", async () => {
    conPermiso({ granted: false, canAskAgain: true });
    await renderConProviders(<EscanearEntrada />, { usuario: FENIX });
    expect(screen.getByTestId("escaner-sin-permiso")).toHaveTextContent(
      /Necesitamos la cámara para escanear entradas/,
    );
    expect(screen.queryByTestId("escaner-camara")).toBeNull();
    await fireEvent.press(screen.getByTestId("escaner-dar-permiso"));
    expect(pedirPermiso).toHaveBeenCalled();
  });

  it("si ya no se puede pedir abre los ajustes", async () => {
    const abrirAjustes = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    conPermiso({ granted: false, canAskAgain: false });
    await renderConProviders(<EscanearEntrada />, { usuario: FENIX });
    await fireEvent.press(screen.getByTestId("escaner-ajustes"));
    expect(abrirAjustes).toHaveBeenCalled();
    expect(pedirPermiso).not.toHaveBeenCalled();
  });
});

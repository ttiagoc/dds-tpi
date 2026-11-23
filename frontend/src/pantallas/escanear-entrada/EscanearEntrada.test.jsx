import { act, fireEvent, screen } from "@testing-library/react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import { Linking } from "react-native";
import EscanearEntrada from "./EscanearEntrada";
import { marcarUtilizada, obtenerCompra } from "../../api/comprasApi";
import { FENIX, renderConProviders } from "../../test-utils/renderConProviders";
import { compraDetalle, errorHttp } from "../../test-utils/fixtures";
import { SIN_ACCIONES } from "../../test-utils/detalleCompra";

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
const CONFIRMADA = compraDetalle({
  acciones: { ...SIN_ACCIONES, puedeMarcarUtilizada: true },
});
const UTILIZADA = compraDetalle({ estado: "UTILIZADA", acciones: SIN_ACCIONES });

const conPermiso = (permiso) => useCameraPermissions.mockReturnValue([permiso, pedirPermiso]);
const camara = () => CameraView.mock.calls.at(-1)[0];
const escanear = (data) => act(async () => camara().onBarcodeScanned({ type: "qr", data }));

async function abrir() {
  await renderConProviders(<EscanearEntrada />, { usuario: FENIX });
  await screen.findByTestId("escaner-camara");
}

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({ id: "1" });
  conPermiso({ granted: true, canAskAgain: true });
  obtenerCompra.mockResolvedValue(CONFIRMADA);
  marcarUtilizada.mockResolvedValue(UTILIZADA);
});

describe("EscanearEntrada: validar", () => {
  it("escanea solo QR y pide que apunte a la entrada", async () => {
    await abrir();
    expect(camara().barcodeScannerSettings).toEqual({ barcodeTypes: ["qr"] });
    expect(screen.getByText("Apuntá al QR de la entrada")).toBeTruthy();
  });

  it("lee la compra, la valida y muestra Entrada validada", async () => {
    await abrir();
    await escanear("aiticketit:compra:7");
    expect(obtenerCompra).toHaveBeenCalledWith(7);
    const resultado = screen.getByTestId("escaner-resultado");
    expect(resultado).toHaveTextContent(/Ana Pérez/);
    expect(resultado).toHaveTextContent(/Campo × 2/);
    expect(camara().onBarcodeScanned).toBeUndefined();
    await fireEvent.press(screen.getByTestId("escaner-validar"));
    expect(marcarUtilizada).toHaveBeenCalledWith(7);
    expect(await screen.findByTestId("escaner-validada")).toHaveTextContent(/Entrada validada/);
  });

  it("Escanear otra vuelve a la cámara", async () => {
    await abrir();
    await escanear("aiticketit:compra:7");
    await fireEvent.press(screen.getByTestId("escaner-otra"));
    expect(screen.getByText("Apuntá al QR de la entrada")).toBeTruthy();
    expect(camara().onBarcodeScanned).toEqual(expect.any(Function));
  });

  it("si el back rechaza la validación muestra su mensaje", async () => {
    marcarUtilizada.mockRejectedValue(errorHttp(422, "No se puede pasar de UTILIZADA a UTILIZADA"));
    await abrir();
    await escanear("aiticketit:compra:7");
    await fireEvent.press(screen.getByTestId("escaner-validar"));
    expect(await screen.findByTestId("escaner-error")).toHaveTextContent(
      "No se puede pasar de UTILIZADA a UTILIZADA",
    );
  });
});

describe("EscanearEntrada: no se puede validar", () => {
  it.each([
    ["UTILIZADA", "Esta entrada ya fue utilizada"],
    ["PENDIENTE", "Esta compra todavía no está pagada"],
    ["CANCELADA", "Esta compra está cancelada"],
    ["REEMBOLSADA", "Esta compra está cancelada"],
  ])("con la compra %s avisa el motivo, sin botón", async (estado, motivo) => {
    obtenerCompra.mockResolvedValue(compraDetalle({ estado, acciones: SIN_ACCIONES }));
    await abrir();
    await escanear("aiticketit:compra:7");
    expect(screen.getByTestId("escaner-motivo")).toHaveTextContent(new RegExp(motivo));
    expect(screen.queryByTestId("escaner-validar")).toBeNull();
  });

  it("una entrada de otro evento no se busca más allá", async () => {
    obtenerCompra.mockResolvedValue(compraDetalle({ evento: { id: 5, nombre: "Otro" } }));
    await abrir();
    await escanear("aiticketit:compra:7");
    expect(screen.getByTestId("escaner-error")).toHaveTextContent(/Esa entrada es de otro evento/);
    expect(screen.queryByTestId("escaner-validar")).toBeNull();
  });

  it("un QR que no es de la app no consulta al back", async () => {
    await abrir();
    await escanear("https://ejemplo.com");
    expect(screen.getByTestId("escaner-error")).toHaveTextContent(
      /Ese QR no es una entrada de AI Ticket It/,
    );
    expect(obtenerCompra).not.toHaveBeenCalled();
  });

  it.each([
    [404, "No existe la compra"],
    [403, "No tenés permiso para realizar esta acción"],
  ])("con %i muestra el mensaje del back", async (status, mensaje) => {
    obtenerCompra.mockRejectedValue(errorHttp(status, mensaje));
    await abrir();
    await escanear("aiticketit:compra:7");
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

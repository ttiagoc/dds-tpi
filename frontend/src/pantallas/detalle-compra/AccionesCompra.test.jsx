import { act, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";
import { cancelarCompra, marcarUtilizada, obtenerCompra, pagarCompra } from "../../api/comprasApi";
import { ANA, FENIX } from "../../test-utils/renderConProviders";
import { compraDetalle, errorHttp, promesaManual } from "../../test-utils/fixtures";
import {
  REEMBOLSADA,
  SIN_ACCIONES,
  abrirDetalleCompra as abrir,
  paso,
} from "../../test-utils/detalleCompra";

jest.mock("../../api/comprasApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const PENDIENTE = compraDetalle({
  estado: "PENDIENTE",
  diasRestantes: null,
  historial: [paso("PENDIENTE", "00")],
  acciones: { ...SIN_ACCIONES, puedePagar: true, puedeCancelar: true },
});

const PAGADA = compraDetalle({ historial: [paso("PENDIENTE", "00"), paso("CONFIRMADA", "05")] });

const CANCELADA = compraDetalle({
  estado: "CANCELADA",
  diasRestantes: null,
  historial: [paso("PENDIENTE", "00"), paso("CANCELADA", "10")],
  acciones: SIN_ACCIONES,
});

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({ id: "7" });
  obtenerCompra.mockResolvedValue(compraDetalle());
});

describe("DetalleCompra: botones según acciones", () => {
  it.each([
    ["ninguno", SIN_ACCIONES, false, false],
    ["solo pagar", { ...SIN_ACCIONES, puedePagar: true }, true, false],
    ["solo cancelar", { ...SIN_ACCIONES, puedeCancelar: true }, false, true],
    ["los dos", { ...SIN_ACCIONES, puedePagar: true, puedeCancelar: true }, true, true],
  ])("con %s muestra esos botones", async (_, acciones, pagar, cancelar) => {
    obtenerCompra.mockResolvedValue(compraDetalle({ acciones }));
    await abrir();
    expect(!!screen.queryByTestId("compra-pagar")).toBe(pagar);
    expect(!!screen.queryByTestId("compra-cancelar")).toBe(cancelar);
  });

  it("sin acciones en la respuesta no muestra botones", async () => {
    obtenerCompra.mockResolvedValue(compraDetalle({ acciones: undefined }));
    await abrir();
    expect(screen.queryByTestId("compra-pagar")).toBeNull();
    expect(screen.queryByTestId("compra-cancelar")).toBeNull();
  });
});

describe("DetalleCompra: pagar", () => {
  beforeEach(() => obtenerCompra.mockResolvedValue(PENDIENTE));

  it("paga sin diálogo, se actualiza con la respuesta y avisa", async () => {
    const pago = promesaManual();
    pagarCompra.mockReturnValue(pago.promesa);
    await abrir();
    await fireEvent.press(screen.getByTestId("compra-pagar"));
    expect(pagarCompra).toHaveBeenCalledWith(7);
    expect(screen.getByTestId("compra-pagar")).toBeDisabled();
    expect(screen.getByTestId("compra-cancelar")).toBeDisabled();
    await act(async () => pago.resolver(PAGADA));
    expect(await screen.findByTestId("compra-aviso")).toHaveTextContent("Pago confirmado");
    expect(screen.getByTestId("compra-estado")).toHaveTextContent(/Confirmada/);
    expect(screen.getByTestId("dias-restantes")).toHaveTextContent("Faltan 12 días");
    expect(screen.getByTestId("historial-1")).toHaveTextContent(/Confirmada/);
    expect(screen.queryByTestId("compra-pagar")).toBeNull();
    expect(screen.getByTestId("compra-cancelar")).toBeEnabled();
    expect(obtenerCompra).toHaveBeenCalledTimes(1);
  });

  it("con doble toque hace un solo pedido", async () => {
    const pago = promesaManual();
    pagarCompra.mockReturnValue(pago.promesa);
    await abrir();
    await fireEvent.press(screen.getByTestId("compra-pagar"));
    await fireEvent.press(screen.getByTestId("compra-pagar"));
    await fireEvent.press(screen.getByTestId("compra-cancelar"));
    expect(pagarCompra).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("confirmar-cancelacion")).toBeNull();
    await act(async () => pago.resolver(PAGADA));
  });

  it("con 422 muestra el texto del back y vuelve a pedir la compra", async () => {
    const mensaje = "No podés pagar una compra de un evento que ya ocurrió";
    pagarCompra.mockRejectedValue(errorHttp(422, mensaje));
    await abrir();
    obtenerCompra.mockResolvedValue(compraDetalle({ estado: "PENDIENTE", acciones: SIN_ACCIONES }));
    await fireEvent.press(screen.getByTestId("compra-pagar"));
    expect(await screen.findByTestId("compra-accion-error")).toHaveTextContent(mensaje);
    await waitFor(() => expect(screen.queryByTestId("compra-pagar")).toBeNull());
    expect(obtenerCompra).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("compra-accion-error")).toHaveTextContent(mensaje);
  });

  it("con error de red muestra el mensaje, no recarga y lo limpia al reintentar", async () => {
    pagarCompra.mockRejectedValueOnce(new Error("red")).mockResolvedValueOnce(PAGADA);
    await abrir();
    await fireEvent.press(screen.getByTestId("compra-pagar"));
    expect(await screen.findByTestId("compra-accion-error")).toHaveTextContent(
      "No pudimos conectar con el servidor",
    );
    expect(obtenerCompra).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId("compra-pagar"));
    await screen.findByTestId("compra-aviso");
    expect(screen.queryByTestId("compra-accion-error")).toBeNull();
  });
});

describe("DetalleCompra: cancelar", () => {
  it("una confirmada pide confirmación con el reembolso y termina reembolsada", async () => {
    cancelarCompra.mockResolvedValue(REEMBOLSADA);
    await abrir();
    await fireEvent.press(screen.getByTestId("compra-cancelar"));
    expect(screen.getByText("¿Cancelar la compra?")).toBeTruthy();
    expect(
      screen.getByText(/Se liberan las 2 entradas y se te reembolsan \$\s90\.000\./),
    ).toBeTruthy();
    expect(cancelarCompra).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId("confirmar-cancelacion"));
    expect(cancelarCompra).toHaveBeenCalledWith(7);
    expect(await screen.findByTestId("compra-aviso")).toHaveTextContent(
      "Compra cancelada y reembolsada",
    );
    expect(screen.getByTestId("compra-estado")).toHaveTextContent(/Reembolsada/);
    expect(screen.queryByTestId("compra-pagar")).toBeNull();
    expect(screen.queryByTestId("compra-cancelar")).toBeNull();
  });

  it("una pendiente de una entrada avisa que se libera y queda cancelada", async () => {
    obtenerCompra.mockResolvedValue({ ...PENDIENTE, cantidad: 1 });
    cancelarCompra.mockResolvedValue(CANCELADA);
    await abrir();
    await fireEvent.press(screen.getByTestId("compra-cancelar"));
    expect(screen.getByText("Se libera la entrada.")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("confirmar-cancelacion"));
    expect(await screen.findByTestId("compra-aviso")).toHaveTextContent(/^Compra cancelada$/);
    expect(screen.getByTestId("compra-estado")).toHaveTextContent(/Cancelada/);
  });

  it("Volver cierra el diálogo sin llamar al back", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("compra-cancelar"));
    await fireEvent.press(screen.getByRole("button", { name: "Volver" }));
    await waitFor(() => expect(screen.queryByTestId("confirmar-cancelacion")).toBeNull());
    expect(cancelarCompra).not.toHaveBeenCalled();
    expect(screen.getByTestId("compra-estado")).toHaveTextContent(/Confirmada/);
  });
});

const PARA_FENIX = compraDetalle({
  acciones: { ...SIN_ACCIONES, puedeMarcarUtilizada: true },
});

const MARCADA = compraDetalle({
  estado: "UTILIZADA",
  diasRestantes: null,
  acciones: SIN_ACCIONES,
  historial: [paso("PENDIENTE", "00"), paso("CONFIRMADA", "05"), paso("UTILIZADA", "30")],
});

describe("DetalleCompra: marcar utilizada", () => {
  beforeEach(() => obtenerCompra.mockResolvedValue(PARA_FENIX));

  it.each([
    [true, true],
    [false, false],
  ])("con puedeMarcarUtilizada %s el botón se ve: %s", async (puede, seVe) => {
    obtenerCompra.mockResolvedValue(
      compraDetalle({ acciones: { ...SIN_ACCIONES, puedeMarcarUtilizada: puede } }),
    );
    await abrir(FENIX);
    expect(!!screen.queryByTestId("compra-utilizada")).toBe(seVe);
  });

  it("Volver cierra el diálogo sin llamar al back", async () => {
    await abrir(FENIX);
    await fireEvent.press(screen.getByTestId("compra-utilizada"));
    expect(screen.getByText("¿Marcar la entrada como utilizada?")).toBeTruthy();
    expect(
      screen.getByText("El comprador va a poder reseñar la compra. No se puede deshacer."),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Volver" }));
    expect(screen.queryByText("¿Cancelar la compra?")).toBeNull();
    await waitFor(() => expect(screen.queryByTestId("confirmar-utilizada")).toBeNull());
    expect(screen.queryByText("¿Cancelar la compra?")).toBeNull();
    expect(marcarUtilizada).not.toHaveBeenCalled();
  });

  it("al confirmar la marca, se actualiza con la respuesta y avisa", async () => {
    const uso = promesaManual();
    marcarUtilizada.mockReturnValue(uso.promesa);
    await abrir(FENIX);
    await fireEvent.press(screen.getByTestId("compra-utilizada"));
    await fireEvent.press(screen.getByTestId("confirmar-utilizada"));
    expect(marcarUtilizada).toHaveBeenCalledWith(7);
    expect(screen.getByTestId("compra-utilizada")).toBeDisabled();
    await fireEvent.press(screen.getByTestId("compra-utilizada"));
    await waitFor(() => expect(screen.queryByTestId("confirmar-utilizada")).toBeNull());
    await act(async () => uso.resolver(MARCADA));
    expect(await screen.findByTestId("compra-aviso")).toHaveTextContent(
      "Entrada marcada como utilizada",
    );
    expect(screen.getByTestId("compra-estado")).toHaveTextContent(/Utilizada/);
    expect(screen.queryByTestId("compra-utilizada")).toBeNull();
    expect(marcarUtilizada).toHaveBeenCalledTimes(1);
  });
});

describe("DetalleCompra: 422 en acciones con confirmación", () => {
  it.each([
    [
      "cancelar",
      () => cancelarCompra,
      ANA,
      "No podés cancelar una compra de un evento que ya ocurrió",
      { puedeCancelar: true },
      ["compra-cancelar", "confirmar-cancelacion"],
    ],
    [
      "marcar utilizada",
      () => marcarUtilizada,
      FENIX,
      "No se puede pasar de CANCELADA a UTILIZADA",
      { puedeMarcarUtilizada: true },
      ["compra-utilizada", "confirmar-utilizada"],
    ],
  ])("al %s muestra el texto exacto y recarga", async (_, api, usuario, msj, acciones, ids) => {
    obtenerCompra.mockResolvedValue(compraDetalle({ acciones: { ...SIN_ACCIONES, ...acciones } }));
    api().mockRejectedValue(errorHttp(422, msj));
    await abrir(usuario);
    for (const id of ids) await fireEvent.press(screen.getByTestId(id));
    expect(await screen.findByTestId("compra-accion-error")).toHaveTextContent(msj);
    await waitFor(() => expect(obtenerCompra).toHaveBeenCalledTimes(2));
  });
});

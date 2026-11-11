import { act, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import DetalleCompra from "./DetalleCompra";
import { cancelarCompra, obtenerCompra, pagarCompra } from "../../api/comprasApi";
import { renderConProviders, ANA } from "../../test-utils/renderConProviders";
import { compraDetalle, errorHttp, promesaManual, resenia } from "../../test-utils/fixtures";

jest.mock("../../api/comprasApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const SIN_ACCIONES = {
  puedePagar: false,
  puedeCancelar: false,
  puedeMarcarUtilizada: false,
  puedeReseniar: false,
};

const paso = (estado, minuto) => ({
  estado,
  quien: { id: 1, nombre: "Ana Pérez" },
  fechaHora: `2026-11-01T15:${minuto}:00.000Z`,
});

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

const REEMBOLSADA = compraDetalle({
  estado: "REEMBOLSADA",
  diasRestantes: null,
  acciones: SIN_ACCIONES,
  historial: ["PENDIENTE", "CONFIRMADA", "CANCELADA", "REEMBOLSADA"].map((estado, i) => ({
    estado,
    quien: { id: 1, nombre: "Ana Pérez" },
    fechaHora: `2026-11-0${i + 1}T15:00:00.000Z`,
  })),
});

async function abrir() {
  await renderConProviders(<DetalleCompra />, { usuario: ANA });
  await screen.findByTestId("linea-de-tiempo");
}

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
    expect(screen.queryByRole("button", { name: /Pagar|Cancelar|Reseñar|Chat/ })).toBeNull();
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

  it("con 422 muestra el texto exacto del back y recarga", async () => {
    const mensaje = "No podés cancelar una compra de un evento que ya ocurrió";
    cancelarCompra.mockRejectedValue(errorHttp(422, mensaje));
    await abrir();
    await fireEvent.press(screen.getByTestId("compra-cancelar"));
    await fireEvent.press(screen.getByTestId("confirmar-cancelacion"));
    expect(await screen.findByTestId("compra-accion-error")).toHaveTextContent(mensaje);
    await waitFor(() => expect(obtenerCompra).toHaveBeenCalledTimes(2));
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

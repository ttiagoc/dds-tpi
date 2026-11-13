import { act, fireEvent, screen, within } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";
import { ultimoSocket } from "socket.io-client";
import Chat from "./Chat";
import { enviarMensaje, listarMensajes, obtenerCompra } from "../../api/comprasApi";
import { ANA, FENIX, renderConProviders } from "../../test-utils/renderConProviders";
import { compraDetalle, conversacion, errorHttp } from "../../test-utils/fixtures";

jest.mock("../../api/comprasApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const { pregunta: PREGUNTA, respuesta: RESPUESTA, nuevo: NUEVO } = conversacion();

async function abrir(usuario = ANA) {
  await renderConProviders(<Chat />, { usuario });
  await screen.findByTestId("chat-input");
  return ultimoSocket();
}

const conectar = (socket) => act(async () => socket.simular("connect"));

beforeEach(() => {
  jest.clearAllMocks();
  useLocalSearchParams.mockReturnValue({ id: "7" });
  obtenerCompra.mockResolvedValue(compraDetalle());
  listarMensajes.mockResolvedValue([PREGUNTA, RESPUESTA]);
  enviarMensaje.mockResolvedValue(NUEVO);
});

describe("Chat: conversación", () => {
  it("muestra el evento y las burbujas: propias a la derecha sin nombre, ajenas con nombre", async () => {
    await abrir();
    expect(obtenerCompra).toHaveBeenCalledWith("7");
    expect(listarMensajes).toHaveBeenCalledWith(7);
    expect(screen.getByText("Los Piojos en River")).toBeTruthy();
    const propia = screen.getByTestId("mensaje-1");
    expect(propia).toHaveTextContent(/¿A qué hora abren las puertas\?/);
    expect(propia).not.toHaveTextContent(/Ana Pérez/);
    expect(propia).toHaveStyle({ alignSelf: "flex-end" });
    const ajena = screen.getByTestId("mensaje-2");
    expect(ajena).toHaveTextContent(/Fénix Producciones/);
    expect(ajena).toHaveTextContent(/Abrimos a las 17 h/);
    expect(ajena).toHaveStyle({ alignSelf: "flex-start" });
  });

  it("para el organizador sus mensajes son los propios", async () => {
    await abrir(FENIX);
    expect(screen.getByTestId("mensaje-2")).toHaveStyle({ alignSelf: "flex-end" });
    expect(screen.getByTestId("mensaje-1")).toHaveTextContent(/Ana Pérez/);
  });

  it("sin mensajes muestra el vacío", async () => {
    listarMensajes.mockResolvedValue([]);
    await abrir();
    expect(screen.getByTestId("chat-vacio")).toHaveTextContent("Todavía no hay mensajes");
  });

  it("si el historial no carga muestra el error y Reintentar lo vuelve a pedir", async () => {
    listarMensajes.mockRejectedValueOnce(errorHttp(500, "Se rompió"));
    await renderConProviders(<Chat />, { usuario: ANA });
    expect(await screen.findByTestId("error-carga")).toHaveTextContent(/Se rompió/);
    await fireEvent.press(screen.getByTestId("reintentar"));
    expect(await screen.findByTestId("mensaje-2")).toBeTruthy();
  });

  it("si falla una recarga conserva la conversación y muestra el error", async () => {
    await abrir();
    listarMensajes.mockRejectedValueOnce(errorHttp(500, "Se rompió"));
    await fireEvent.press(screen.getByTestId("chat-actualizar"));
    expect(await screen.findByTestId("chat-carga-error")).toHaveTextContent("Se rompió");
    expect(screen.getByTestId("mensaje-2")).toBeTruthy();
    expect(screen.queryByTestId("error-carga")).toBeNull();
  });

  it("una compra ajena o inexistente muestra el aviso de compra inexistente", async () => {
    obtenerCompra.mockRejectedValue(errorHttp(404, "No existe la compra"));
    await renderConProviders(<Chat />, { usuario: ANA });
    expect(await screen.findByTestId("compra-inexistente")).toHaveTextContent(
      /No existe la compra/,
    );
  });

  it("agrega el mensaje que llega en vivo", async () => {
    const socket = await abrir();
    await act(async () =>
      socket.simular("mensaje:nuevo", { ...NUEVO, usuario: RESPUESTA.usuario }),
    );
    expect(screen.getByTestId("mensaje-3")).toHaveTextContent(/Fénix Producciones/);
  });
});

describe("Chat: escribir", () => {
  it("Enviar está deshabilitado sin texto y el contador muestra los caracteres", async () => {
    await abrir();
    expect(screen.getByTestId("chat-enviar")).toBeDisabled();
    expect(screen.getByTestId("chat-contador")).toHaveTextContent("0/500");
    await fireEvent.changeText(screen.getByTestId("chat-input"), "   ");
    expect(screen.getByTestId("chat-enviar")).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId("chat-input"), "Hola");
    expect(screen.getByTestId("chat-contador")).toHaveTextContent("4/500");
    expect(screen.getByTestId("chat-input").props.maxLength).toBe(500);
  });

  it("envía el mensaje sin espacios, lo muestra y limpia el input", async () => {
    await abrir();
    await fireEvent.changeText(screen.getByTestId("chat-input"), "  ¿Hay guardarropas?  ");
    await fireEvent.press(screen.getByLabelText("Enviar mensaje"));
    expect(enviarMensaje).toHaveBeenCalledWith(7, "¿Hay guardarropas?");
    expect(await screen.findByTestId("mensaje-3")).toBeTruthy();
    expect(screen.getByTestId("chat-input").props.value).toBe("");
  });

  it("si el envío falla muestra el error y conserva el texto", async () => {
    enviarMensaje.mockRejectedValue(errorHttp(403, "No tenés permiso para realizar esta acción"));
    await abrir();
    await fireEvent.changeText(screen.getByTestId("chat-input"), "Hola");
    await fireEvent.press(screen.getByTestId("chat-enviar"));
    expect(await screen.findByTestId("chat-error")).toHaveTextContent(
      "No tenés permiso para realizar esta acción",
    );
    expect(screen.getByTestId("chat-input").props.value).toBe("Hola");
  });
});

describe("Chat: conexión en vivo", () => {
  it("sin conexión muestra el aviso y Actualizar vuelve a pedir el historial", async () => {
    await abrir();
    const aviso = screen.getByTestId("chat-sin-conexion");
    expect(aviso).toHaveTextContent(/Sin conexión en vivo/);
    await fireEvent.press(within(aviso).getByTestId("chat-actualizar"));
    expect(listarMensajes).toHaveBeenCalledTimes(2);
  });

  it("al conectarse el aviso desaparece", async () => {
    const socket = await abrir();
    await conectar(socket);
    expect(screen.queryByTestId("chat-sin-conexion")).toBeNull();
  });
});

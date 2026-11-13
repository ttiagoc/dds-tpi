import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import CrearEvento from "./CrearEvento";
import { crearEvento } from "../../api/eventosApi";
import { listarCategorias } from "../../api/categoriasApi";
import { FENIX, renderConProviders } from "../../test-utils/renderConProviders";
import { errorHttp, eventoDetalle, promesaManual } from "../../test-utils/fixtures";

jest.mock("../../api/eventosApi");
jest.mock("../../api/categoriasApi");
jest.mock("expo-router", () => require("../../test-utils/mockRouter").mockRouter());

const CATEGORIAS = [
  { id: 1, nombre: "Recitales" },
  { id: 6, nombre: "Stand-up" },
];
const publicar = () => screen.getByTestId("evento-guardar");
const escribir = (testID, texto) => fireEvent.changeText(screen.getByTestId(testID), texto);

async function abrir() {
  await renderConProviders(<CrearEvento />, { usuario: FENIX });
  await screen.findByTestId("evento-categoria");
}

async function completar() {
  await escribir("evento-nombre", "  Stand-up en el Konex ");
  await escribir("evento-descripcion", "Noche de humor");
  await escribir("evento-lugar", "Ciudad Cultural Konex");
  await fireEvent.press(screen.getByTestId("evento-categoria"));
  await fireEvent.press(await screen.findByTestId("categoria-6"));
  await fireEvent.press(screen.getByTestId("evento-fecha"));
  await fireEvent.press(screen.getByTestId("modal-fecha-ok"));
  await fireEvent.press(screen.getByTestId("evento-hora"));
  await fireEvent.press(screen.getByTestId("modal-hora-ok"));
  await escribir("tipo-0-nombre", "General");
  await escribir("tipo-0-precio", "15000");
  await escribir("tipo-0-cupo", "200");
}

beforeEach(() => {
  jest.clearAllMocks();
  listarCategorias.mockResolvedValue(CATEGORIAS);
  crearEvento.mockResolvedValue(eventoDetalle({ id: 20 }));
});

describe("CrearEvento: formulario", () => {
  it("arranca con un tipo vacío, sin Quitar y con Publicar deshabilitado", async () => {
    await abrir();
    expect(screen.getByTestId("tipo-0-nombre")).toBeTruthy();
    expect(screen.queryByTestId("tipo-0-quitar")).toBeNull();
    expect(publicar()).toBeDisabled();
  });

  it("muestra la categoría, el día y la hora elegidos", async () => {
    await abrir();
    await completar();
    expect(screen.getByTestId("evento-categoria")).toHaveTextContent(/Stand-up/);
    expect(screen.getByTestId("evento-fecha")).toHaveTextContent(/5 dic 2026/);
    expect(screen.getByTestId("evento-hora")).toHaveTextContent(/22:00/);
  });

  it("Publicar se habilita recién con el cupo del tipo", async () => {
    await abrir();
    await completar();
    await escribir("tipo-0-cupo", "");
    expect(publicar()).toBeDisabled();
    await escribir("tipo-0-cupo", "200");
    expect(publicar()).toBeEnabled();
  });

  it("agrega tipos y quita cualquiera menos el último", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("tipo-agregar"));
    expect(screen.getByLabelText("Quitar tipo 1")).toBeTruthy();
    await escribir("tipo-1-nombre", "Platea");
    await fireEvent.press(screen.getByTestId("tipo-0-quitar"));
    expect(screen.getByTestId("tipo-0-nombre")).toHaveProp("value", "Platea");
    expect(screen.queryByTestId("tipo-0-quitar")).toBeNull();
  });
});

describe("CrearEvento: envío", () => {
  it("publica el evento y vuelve a Mis eventos con aviso", async () => {
    await abrir();
    await completar();
    await fireEvent.press(publicar());
    expect(crearEvento).toHaveBeenCalledWith({
      nombre: "Stand-up en el Konex",
      descripcion: "Noche de humor",
      categoriaId: 6,
      fecha: new Date(2026, 11, 5, 22, 0).toISOString(),
      lugar: "Ciudad Cultural Konex",
      multimedia: [],
      tiposEntrada: [{ nombre: "General", precio: 15000, cupo: 200 }],
    });
    expect(router.dismissTo).toHaveBeenCalledWith({
      pathname: "/mis-eventos",
      params: { aviso: "evento-creado" },
    });
  });

  it("mientras publica, un segundo toque no repite el pedido", async () => {
    const respuesta = promesaManual();
    crearEvento.mockReturnValue(respuesta.promesa);
    await abrir();
    await completar();
    await fireEvent.press(publicar());
    expect(publicar()).toBeDisabled();
    await fireEvent.press(publicar());
    expect(crearEvento).toHaveBeenCalledTimes(1);
    await act(async () => respuesta.resolver(eventoDetalle()));
  });

  it.each([
    [422, "La fecha del evento tiene que ser futura"],
    [422, "Ya hay un tipo de entrada llamado General"],
    [400, "Datos inválidos"],
  ])('con %i muestra "%s" sin perder lo cargado', async (status, mensaje) => {
    crearEvento.mockRejectedValueOnce(errorHttp(status, mensaje));
    await abrir();
    await completar();
    await fireEvent.press(publicar());
    expect(await screen.findByTestId("evento-error")).toHaveTextContent(mensaje);
    expect(screen.getByTestId("evento-nombre")).toHaveProp("value", "  Stand-up en el Konex ");
    expect(screen.getByTestId("tipo-0-cupo")).toHaveProp("value", "200");
    expect(router.dismissTo).not.toHaveBeenCalled();
    await fireEvent.press(publicar());
    expect(screen.queryByTestId("evento-error")).toBeNull();
  });
});

describe("CrearEvento: categorías", () => {
  it("mientras cargan muestra un indicador", async () => {
    const pedido = promesaManual();
    listarCategorias.mockReturnValue(pedido.promesa);
    await renderConProviders(<CrearEvento />, { usuario: FENIX });
    expect(screen.getByLabelText("Cargando categorías")).toBeTruthy();
    await act(async () => pedido.resolver(CATEGORIAS));
    expect(await screen.findByTestId("evento-categoria")).toBeTruthy();
  });

  it("si no cargan muestra el error y Reintentar las vuelve a pedir", async () => {
    listarCategorias.mockRejectedValueOnce(new Error("red"));
    await renderConProviders(<CrearEvento />, { usuario: FENIX });
    expect(await screen.findByTestId("categorias-error")).toHaveTextContent(
      "No pudimos conectar con el servidor",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByTestId("evento-categoria")).toBeTruthy();
    expect(listarCategorias).toHaveBeenCalledTimes(2);
  });
});

import { AccessibilityInfo } from "react-native";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { ultimasProps } from "react-native-paper-dates";
import { router } from "expo-router";
import CrearEvento from "./CrearEvento";
import { crearEvento } from "../../api/eventosApi";
import { listarCategorias } from "../../api/categoriasApi";
import { FENIX, renderConProviders } from "../../test-utils/renderConProviders";
import {
  errorHttp,
  eventoDetalle,
  paginaDeCategorias,
  dosPaginasDeCategorias,
  promesaManual,
} from "../../test-utils/fixtures";

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

async function completar({ sinHora = false } = {}) {
  await escribir("evento-nombre", "  Stand-up en el Konex ");
  await escribir("evento-descripcion", "Noche de humor");
  await escribir("evento-lugar", "Ciudad Cultural Konex");
  await fireEvent(screen.getByTestId("evento-categoria"), "focus");
  await fireEvent.press(await screen.findByTestId("categoria-6"));
  await fireEvent.press(screen.getByTestId("evento-fecha"));
  await fireEvent.press(screen.getByTestId("modal-fecha-ok"));
  if (!sinHora) {
    await fireEvent.press(screen.getByTestId("evento-hora"));
    await fireEvent.press(screen.getByTestId("modal-hora-ok"));
  }
  await escribir("tipo-0-nombre", "General");
  await escribir("tipo-0-precio", "15000");
  await escribir("tipo-0-cupo", "200");
}

beforeEach(() => {
  jest.clearAllMocks();
  listarCategorias.mockResolvedValue(paginaDeCategorias(CATEGORIAS));
  crearEvento.mockResolvedValue(eventoDetalle({ id: 20 }));
});

describe("CrearEvento: formulario", () => {
  it("arranca con un tipo vacío, sin Quitar y con Publicar habilitado", async () => {
    await abrir();
    expect(screen.getByTestId("tipo-0-nombre")).toBeTruthy();
    expect(screen.queryByTestId("tipo-0-quitar")).toBeNull();
    expect(publicar()).toBeEnabled();
  });

  it("el calendario no deja elegir días anteriores a hoy", async () => {
    await abrir();
    const { startDate } = ultimasProps["modal-fecha-ok"].validRange;
    const hoy = new Date();
    expect(startDate).toEqual(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
  });

  it("muestra la categoría, el día y la hora elegidos", async () => {
    await abrir();
    await completar();
    expect(screen.getByTestId("evento-categoria")).toHaveProp("value", "Stand-up");
    expect(screen.queryByTestId("categorias-lista")).toBeNull();
    expect(screen.getByTestId("evento-fecha")).toHaveTextContent(/5 dic 2026/);
    expect(screen.getByTestId("evento-hora")).toHaveTextContent(/22:00/);
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

describe("CrearEvento: validación al publicar", () => {
  it("vacío marca los errores, no llama a la API, anuncia y enfoca el nombre", async () => {
    const anunciar = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
    await abrir();
    await fireEvent.press(publicar());
    expect(crearEvento).not.toHaveBeenCalled();
    expect(screen.getByTestId("evento-nombre-error")).toHaveTextContent(
      "El nombre tiene que tener entre 3 y 100 caracteres",
    );
    expect(screen.getByTestId("evento-categoria-error")).toHaveTextContent("Elegí una categoría");
    expect(screen.getByTestId("evento-hora-error")).toHaveTextContent("Elegí la hora");
    expect(screen.getByTestId("tipo-0-cupo-error")).toBeTruthy();
    expect(screen.getByTestId("evento-error")).toHaveTextContent("Revisá los 9 campos marcados");
    expect(anunciar).toHaveBeenCalledWith("Revisá los 9 campos marcados");
    expect(screen.getByTestId("evento-nombre")).toHaveProp("accessibilityHint", expect.any(String));
  });

  it("si solo falta la hora, marca solo la hora", async () => {
    await abrir();
    await completar({ sinHora: true });
    await fireEvent.press(publicar());
    expect(crearEvento).not.toHaveBeenCalled();
    expect(screen.getByTestId("evento-hora-error")).toHaveTextContent("Elegí la hora");
    expect(screen.queryByTestId("evento-nombre-error")).toBeNull();
    expect(screen.getByTestId("evento-error")).toHaveTextContent("Revisá el campo marcado");
  });

  it("el error de un campo se borra al editarlo", async () => {
    await abrir();
    await fireEvent.press(publicar());
    await escribir("evento-nombre", "Recital");
    expect(screen.queryByTestId("evento-nombre-error")).toBeNull();
    expect(screen.getByTestId("evento-descripcion-error")).toBeTruthy();
  });

  it("con un cupo inválido marca ese campo", async () => {
    await abrir();
    await completar();
    await escribir("tipo-0-cupo", "1.5");
    await fireEvent.press(publicar());
    expect(crearEvento).not.toHaveBeenCalled();
    expect(screen.getByTestId("tipo-0-cupo-error")).toHaveTextContent(
      "El cupo tiene que ser un número entero mayor a 0",
    );
    expect(screen.getByTestId("evento-error")).toHaveTextContent("Revisá el campo marcado");
  });

  it("los details del back se muestran en su campo y en el aviso", async () => {
    const mensaje = "La fecha del evento tiene que ser futura";
    crearEvento.mockRejectedValueOnce(errorHttp(422, mensaje, [{ campo: "fecha", mensaje }]));
    await abrir();
    await completar();
    await fireEvent.press(publicar());
    expect(await screen.findByTestId("evento-fecha-error")).toHaveTextContent(mensaje);
    expect(screen.getByTestId("evento-aviso-error")).toHaveTextContent(mensaje);
  });

  it("un 400 con details de un tipo marca ese campo", async () => {
    crearEvento.mockRejectedValueOnce(
      errorHttp(400, "Datos inválidos", [{ campo: "tiposEntrada.0.precio", mensaje: "Muy caro" }]),
    );
    await abrir();
    await completar();
    await fireEvent.press(publicar());
    expect(await screen.findByTestId("tipo-0-precio-error")).toHaveTextContent("Muy caro");
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

const esperar = (ms) => act(() => new Promise((listo) => setTimeout(listo, ms)));
const abrirCategorias = () => fireEvent(screen.getByTestId("evento-categoria"), "focus");

describe("CrearEvento: categorías", () => {
  it("al enfocar muestra la primera página de categorías", async () => {
    await abrir();
    await abrirCategorias();
    expect(await screen.findByTestId("categoria-1")).toBeTruthy();
    expect(listarCategorias).toHaveBeenLastCalledWith({ page: 1, limit: 10 });
  });

  it("escribir filtra con debounce", async () => {
    await abrir();
    await abrirCategorias();
    await fireEvent.changeText(screen.getByTestId("evento-categoria"), "conf");
    expect(listarCategorias).not.toHaveBeenCalledWith(expect.objectContaining({ q: "conf" }));
    await esperar(350);
    expect(listarCategorias).toHaveBeenLastCalledWith({ q: "conf", page: 1, limit: 10 });
  });

  it("al llegar al final de la lista carga la página siguiente", async () => {
    const [primera, segunda] = dosPaginasDeCategorias(CATEGORIAS, [{ id: 9, nombre: "Tango" }]);
    listarCategorias.mockResolvedValueOnce(primera).mockResolvedValueOnce(segunda);
    await abrir();
    await abrirCategorias();
    await screen.findByTestId("categoria-1");
    await fireEvent.scroll(screen.getByTestId("categorias-lista"), {
      nativeEvent: {
        layoutMeasurement: { height: 240 },
        contentOffset: { y: 100 },
        contentSize: { height: 340 },
      },
    });
    expect(await screen.findByTestId("categoria-9")).toBeTruthy();
    expect(listarCategorias).toHaveBeenLastCalledWith({ page: 2, limit: 10 });
  });

  it("sin coincidencias avisa", async () => {
    await abrir();
    listarCategorias.mockResolvedValue(paginaDeCategorias([]));
    await abrirCategorias();
    await fireEvent.changeText(screen.getByTestId("evento-categoria"), "zzz");
    await esperar(350);
    expect(await screen.findByTestId("categorias-vacio")).toHaveTextContent(
      "No hay categorías con ese nombre",
    );
  });

  it("editar después de elegir deja la categoría sin elegir", async () => {
    await abrir();
    await completar();
    await fireEvent.changeText(screen.getByTestId("evento-categoria"), "Stand-u");
    await fireEvent.press(publicar());
    expect(crearEvento).not.toHaveBeenCalled();
    expect(screen.getByTestId("evento-categoria-error")).toHaveTextContent("Elegí una categoría");
  });

  it("si no cargan muestra el error y Reintentar las vuelve a pedir", async () => {
    listarCategorias.mockRejectedValueOnce(new Error("red"));
    await abrir();
    await abrirCategorias();
    expect(await screen.findByTestId("categorias-error")).toHaveTextContent(
      "No pudimos conectar con el servidor",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByTestId("categoria-1")).toBeTruthy();
  });
});

import { screen, fireEvent, waitFor, act, within } from "@testing-library/react-native";
import { Keyboard } from "react-native";
import { router } from "expo-router";
import Explorar from "./Explorar";
import { buscarEventos } from "../../api/eventosApi";
import { listarCategorias } from "../../api/categoriasApi";
import { renderConProviders, ANA } from "../../test-utils/renderConProviders";
import {
  errorHttp,
  eventoResumen,
  paginaDeEventos,
  promesaManual,
  paginaDeCategorias,
  dosPaginasDeCategorias,
} from "../../test-utils/fixtures";

jest.mock("../../api/eventosApi");
jest.mock("../../api/categoriasApi");
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const PIOJOS = eventoResumen({ id: 1, nombre: "Los Piojos en River" });
const KONEX = eventoResumen({ id: 2, nombre: "Stand-up en el Konex" });
const CATEGORIAS = [
  { id: 1, nombre: "Recitales", descripcion: "" },
  { id: 6, nombre: "Stand-up", descripcion: "" },
];

const ultimoPedido = () => buscarEventos.mock.calls.at(-1)[0];
const esperar = (ms) => act(() => new Promise((listo) => setTimeout(listo, ms)));

async function abrir() {
  await renderConProviders(<Explorar />, { usuario: ANA });
  await screen.findByTestId("tarjeta-evento-1");
}

beforeEach(() => {
  jest.clearAllMocks();
  listarCategorias.mockResolvedValue(paginaDeCategorias(CATEGORIAS));
  buscarEventos.mockResolvedValue(paginaDeEventos([PIOJOS]));
});

describe("Explorar: chips de categorías", () => {
  it("al llegar al final de la fila pide la página siguiente de categorías", async () => {
    const [primera, segunda] = dosPaginasDeCategorias(CATEGORIAS, [{ id: 9, nombre: "Tango" }]);
    listarCategorias.mockResolvedValueOnce(primera).mockResolvedValueOnce(segunda);
    await abrir();
    await fireEvent(screen.getByTestId("chip-categoria-fila"), "endReached");
    expect(await screen.findByTestId("chip-categoria-9")).toBeTruthy();
    expect(listarCategorias).toHaveBeenLastCalledWith({ page: 2, limit: 10 });
  });
});

describe("Explorar: inicio", () => {
  it("saluda al usuario y titula la lista como próximos eventos", async () => {
    await abrir();
    expect(screen.getByText("Hola, Ana")).toBeTruthy();
    expect(screen.getByTestId("titulo-lista")).toHaveTextContent("Próximos eventos");
  });

  it("con búsqueda o filtro el título pasa a Resultados", async () => {
    await abrir();
    await fireEvent.changeText(screen.getByTestId("buscador"), "piojos");
    expect(screen.getByTestId("titulo-lista")).toHaveTextContent("Resultados");
  });

  it("tocar Buscar en el teclado lo cierra", async () => {
    const cerrar = jest.spyOn(Keyboard, "dismiss");
    await abrir();
    expect(screen.getByTestId("buscador").props.returnKeyType).toBe("search");
    await fireEvent(screen.getByTestId("buscador"), "submitEditing");
    expect(cerrar).toHaveBeenCalled();
    cerrar.mockRestore();
  });
});

describe("Explorar: carga y criterios", () => {
  it("carga la primera página ordenada por fecha más próxima", async () => {
    await abrir();
    expect(buscarEventos).toHaveBeenCalledTimes(1);
    expect(ultimoPedido()).toEqual({ ordenarPor: "fecha", orden: "asc", page: 1, limit: 6 });
    expect(screen.getByText("Los Piojos en River")).toBeTruthy();
    expect(screen.getByTestId("orden-menu")).toHaveTextContent(/Fecha: más próximos/);
  });

  it("busca por texto una sola vez cuando se deja de escribir", async () => {
    await abrir();
    await fireEvent.changeText(screen.getByTestId("buscador"), "pi");
    await fireEvent.changeText(screen.getByTestId("buscador"), " piojos ");
    await waitFor(() => expect(ultimoPedido()).toMatchObject({ q: "piojos", page: 1 }));
    const conTexto = buscarEventos.mock.calls.filter(([criterio]) => criterio.q);
    expect(conTexto).toHaveLength(1);
  });

  it("filtra por categoría y Todas quita el filtro", async () => {
    await abrir();
    await fireEvent.press(await screen.findByTestId("chip-categoria-6"));
    await waitFor(() => expect(ultimoPedido()).toMatchObject({ categoria: 6, page: 1 }));
    await fireEvent.press(screen.getByTestId("chip-categoria-todas"));
    await waitFor(() => expect(ultimoPedido().categoria).toBeUndefined());
  });

  it("tocar la categoría seleccionada también quita el filtro", async () => {
    await abrir();
    await fireEvent.press(await screen.findByTestId("chip-categoria-1"));
    await waitFor(() => expect(ultimoPedido().categoria).toBe(1));
    await fireEvent.press(screen.getByTestId("chip-categoria-1"));
    await waitFor(() => expect(ultimoPedido().categoria).toBeUndefined());
  });

  it("ordena según la opción elegida en el menú", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("orden-menu"));
    await fireEvent.press(await screen.findByTestId("orden-precio-asc"));
    await waitFor(() =>
      expect(ultimoPedido()).toMatchObject({ ordenarPor: "precio", orden: "asc", page: 1 }),
    );
    expect(screen.getByTestId("orden-menu")).toHaveTextContent(/Precio: menor a mayor/);
  });

  it("si fallan las categorías muestra los eventos igual, sin chips", async () => {
    listarCategorias.mockRejectedValue(errorHttp(500, "Error"));
    await abrir();
    expect(screen.queryByTestId("chip-categoria-todas")).toBeNull();
  });

  it("descarta la respuesta de un criterio viejo que llega tarde", async () => {
    const vieja = promesaManual();
    buscarEventos.mockReturnValueOnce(vieja.promesa);
    buscarEventos.mockResolvedValueOnce(paginaDeEventos([KONEX]));
    await renderConProviders(<Explorar />, { usuario: ANA });
    await fireEvent.press(await screen.findByTestId("chip-categoria-6"));
    await screen.findByTestId("tarjeta-evento-2");
    await act(() => vieja.resolver(paginaDeEventos([PIOJOS])));
    expect(screen.queryByTestId("tarjeta-evento-1")).toBeNull();
  });
});

describe("Explorar: paginado y refresco", () => {
  it("Cargar más agrega la página siguiente y desaparece en la última", async () => {
    buscarEventos
      .mockResolvedValueOnce(paginaDeEventos([PIOJOS], { page: 1, totalPages: 2 }))
      .mockResolvedValueOnce(paginaDeEventos([KONEX], { page: 2, totalPages: 2 }));
    await abrir();
    await fireEvent.press(screen.getByTestId("cargar-mas"));
    await screen.findByTestId("tarjeta-evento-2");
    expect(ultimoPedido()).toMatchObject({ page: 2, limit: 6 });
    expect(screen.getByTestId("tarjeta-evento-1")).toBeTruthy();
    expect(screen.queryByTestId("cargar-mas")).toBeNull();
  });

  it("si falla Cargar más conserva la lista y deja reintentar", async () => {
    buscarEventos
      .mockResolvedValueOnce(paginaDeEventos([PIOJOS], { page: 1, totalPages: 2 }))
      .mockRejectedValueOnce(new Error("red"))
      .mockResolvedValueOnce(paginaDeEventos([KONEX], { page: 2, totalPages: 2 }));
    await abrir();
    await fireEvent.press(screen.getByTestId("cargar-mas"));
    expect(await screen.findByText("No pudimos conectar con el servidor")).toBeTruthy();
    expect(screen.getByTestId("tarjeta-evento-1")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("cargar-mas"));
    await screen.findByTestId("tarjeta-evento-2");
  });

  it("mientras carga la página siguiente el botón queda en loading", async () => {
    const pagina2 = promesaManual();
    buscarEventos
      .mockResolvedValueOnce(paginaDeEventos([PIOJOS], { page: 1, totalPages: 2 }))
      .mockReturnValueOnce(pagina2.promesa);
    await abrir();
    expect(within(screen.getByTestId("cargar-mas")).queryByRole("progressbar")).toBeNull();
    await fireEvent.press(screen.getByTestId("cargar-mas"));
    expect(within(screen.getByTestId("cargar-mas")).getByRole("progressbar")).toBeTruthy();
    expect(screen.getByTestId("cargar-mas")).toBeDisabled();
    await act(() => pagina2.resolver(paginaDeEventos([KONEX], { page: 2, totalPages: 2 })));
    await screen.findByTestId("tarjeta-evento-2");
  });

  it("cambiar de filtro después de cargar la página 2 reemplaza la lista", async () => {
    const MAGO = eventoResumen({ id: 3, nombre: "Magia en el Gran Rex" });
    buscarEventos
      .mockResolvedValueOnce(paginaDeEventos([PIOJOS], { page: 1, totalPages: 2 }))
      .mockResolvedValueOnce(paginaDeEventos([KONEX], { page: 2, totalPages: 2 }))
      .mockResolvedValueOnce(paginaDeEventos([MAGO]));
    await abrir();
    await fireEvent.press(screen.getByTestId("cargar-mas"));
    await screen.findByTestId("tarjeta-evento-2");
    await fireEvent.press(await screen.findByTestId("chip-categoria-6"));
    await screen.findByTestId("tarjeta-evento-3");
    expect(ultimoPedido()).toMatchObject({ categoria: 6, page: 1 });
    expect(screen.queryByTestId("tarjeta-evento-1")).toBeNull();
    expect(screen.queryByTestId("tarjeta-evento-2")).toBeNull();
  });

  it("pull-to-refresh vuelve a pedir la página 1", async () => {
    await abrir();
    const lista = screen.getByTestId("lista-eventos");
    await act(() => lista.props.refreshControl.props.onRefresh());
    await waitFor(() => expect(buscarEventos).toHaveBeenCalledTimes(2));
    expect(ultimoPedido()).toMatchObject({ page: 1 });
  });

  it("si falla el pull-to-refresh conserva la lista y muestra el error abajo", async () => {
    buscarEventos
      .mockResolvedValueOnce(paginaDeEventos([PIOJOS]))
      .mockRejectedValueOnce(new Error("red"));
    await abrir();
    const lista = screen.getByTestId("lista-eventos");
    await act(() => lista.props.refreshControl.props.onRefresh());
    expect(await screen.findByText("No pudimos conectar con el servidor")).toBeTruthy();
    expect(screen.getByTestId("tarjeta-evento-1")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("tocar una tarjeta abre el detalle del evento", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("tarjeta-evento-1"));
    expect(router.push).toHaveBeenCalledWith("/eventos/1");
  });
});

describe("Explorar: vacío y error", () => {
  it("sin resultados con filtros ofrece limpiarlos", async () => {
    buscarEventos.mockResolvedValueOnce(paginaDeEventos([PIOJOS]));
    buscarEventos.mockResolvedValueOnce(paginaDeEventos([], { totalPages: 0 }));
    await abrir();
    await fireEvent.press(await screen.findByTestId("chip-categoria-6"));
    expect(await screen.findByText("No encontramos eventos con esos filtros")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Limpiar filtros" }));
    await waitFor(() => expect(ultimoPedido().categoria).toBeUndefined());
  });

  it("Limpiar filtros con texto y categoría hace un solo pedido sin q ni categoría", async () => {
    buscarEventos.mockResolvedValueOnce(paginaDeEventos([PIOJOS]));
    buscarEventos.mockResolvedValue(paginaDeEventos([], { totalPages: 0 }));
    await abrir();
    await fireEvent.changeText(screen.getByTestId("buscador"), "zzz");
    await waitFor(() => expect(ultimoPedido()).toMatchObject({ q: "zzz" }));
    await fireEvent.press(await screen.findByTestId("chip-categoria-6"));
    await waitFor(() => expect(ultimoPedido()).toMatchObject({ q: "zzz", categoria: 6 }));
    await screen.findByTestId("limpiar-filtros");
    buscarEventos.mockClear();
    await fireEvent.press(screen.getByRole("button", { name: "Limpiar filtros" }));
    await esperar(400);
    expect(buscarEventos).toHaveBeenCalledTimes(1);
    expect(ultimoPedido()).toEqual({ ordenarPor: "fecha", orden: "asc", page: 1, limit: 6 });
  });

  it("sin resultados y sin filtros no ofrece limpiar", async () => {
    buscarEventos.mockResolvedValue(paginaDeEventos([], { totalPages: 0 }));
    await renderConProviders(<Explorar />, { usuario: ANA });
    expect(await screen.findByText("No encontramos eventos con esos filtros")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Limpiar filtros" })).toBeNull();
  });

  it("muestra el error del back y Reintentar vuelve a pedir", async () => {
    buscarEventos.mockRejectedValueOnce(new Error("red"));
    await renderConProviders(<Explorar />, { usuario: ANA });
    expect(await screen.findByText("No pudimos conectar con el servidor")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByTestId("tarjeta-evento-1");
  });
});

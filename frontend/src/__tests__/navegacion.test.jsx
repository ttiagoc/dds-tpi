import { router } from "expo-router";
import { renderRouter, screen } from "expo-router/testing-library";
import { act, fireEvent, waitFor } from "@testing-library/react-native";
import RootLayout from "../app/_layout";
import Inicio from "../app/index";
import LoginRuta from "../app/(auth)/login";
import LayoutComprador from "../app/(comprador)/_layout";
import Explorar from "../app/(comprador)/explorar";
import MisCompras from "../app/(comprador)/mis-compras";
import Favoritos from "../app/(comprador)/favoritos";
import PerfilComprador from "../app/(comprador)/perfil";
import LayoutOrganizador from "../app/(organizador)/_layout";
import MisEventos from "../app/(organizador)/mis-eventos";
import PerfilOrganizador from "../app/(organizador)/cuenta";
import DetalleEventoRuta from "../app/eventos/[id]/index";
import ComprarRuta from "../app/eventos/[id]/comprar";
import ComprasEventoRuta from "../app/eventos/[id]/compras";
import NuevoEventoRuta from "../app/eventos/nuevo";
import CompraRuta from "../app/compras/[id]/index";
import ChatRuta from "../app/compras/[id]/chat";
import { leerSesion } from "../auth/sesion";
import { login, obtenerYo } from "../api/authApi";
import { buscarEventos, listarComprasDelEvento, obtenerEvento } from "../api/eventosApi";
import { listarCategorias } from "../api/categoriasApi";
import { listarMisEventos, obtenerReseniasDeOrganizador } from "../api/organizadoresApi";
import { listarMensajes, listarMisCompras, obtenerCompra } from "../api/comprasApi";
import { ANA, FENIX } from "../test-utils/renderConProviders";
import {
  compraDetalle,
  compraResumen,
  comprasDelEvento,
  errorHttp,
  eventoDetalle,
  eventoPropio,
  eventoResumen,
  paginaDeCompras,
  paginaDeEventos,
  reseniasDe,
} from "../test-utils/fixtures";

jest.mock("../auth/sesion");
jest.mock("../api/authApi");
jest.mock("../api/eventosApi");
jest.mock("../api/categoriasApi");
jest.mock("../api/organizadoresApi");
jest.mock("../api/comprasApi");

const RUTAS = {
  _layout: RootLayout,
  index: Inicio,
  "(auth)/login": LoginRuta,
  "(comprador)/_layout": LayoutComprador,
  "(comprador)/explorar": Explorar,
  "(comprador)/mis-compras": MisCompras,
  "(comprador)/favoritos": Favoritos,
  "(comprador)/perfil": PerfilComprador,
  "(organizador)/_layout": LayoutOrganizador,
  "(organizador)/mis-eventos": MisEventos,
  "(organizador)/cuenta": PerfilOrganizador,
  "eventos/[id]/index": DetalleEventoRuta,
  "eventos/[id]/comprar": ComprarRuta,
  "eventos/[id]/compras": ComprasEventoRuta,
  "eventos/nuevo": NuevoEventoRuta,
  "compras/[id]/index": CompraRuta,
  "compras/[id]/chat": ChatRuta,
};

const conSesion = (usuario) => {
  leerSesion.mockResolvedValue({ token: "t", usuario });
  obtenerYo.mockResolvedValue(usuario);
};

const abrirApp = (initialUrl = "/") => renderRouter(RUTAS, { initialUrl });

beforeEach(() => {
  jest.clearAllMocks();
  leerSesion.mockResolvedValue(null);
  listarCategorias.mockResolvedValue([]);
  buscarEventos.mockResolvedValue(paginaDeEventos([eventoResumen()]));
  obtenerEvento.mockResolvedValue(eventoDetalle());
  obtenerReseniasDeOrganizador.mockResolvedValue(reseniasDe([]));
  listarMisCompras.mockResolvedValue(paginaDeCompras([compraResumen()]));
  obtenerCompra.mockResolvedValue(compraDetalle());
  listarMensajes.mockResolvedValue({ mensajes: [], hayMas: false });
  listarMisEventos.mockResolvedValue(paginaDeEventos([eventoPropio()]));
  listarComprasDelEvento.mockResolvedValue(comprasDelEvento([compraResumen()]));
});

describe("navegación según la sesión", () => {
  it("sin sesión abre el login", async () => {
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/login"));
    expect(screen.getByTestId("login-ingresar")).toBeTruthy();
  });

  it("un comprador con sesión entra a sus tabs", async () => {
    conSesion(ANA);
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/explorar"));
    for (const tab of ["explorar", "mis-compras", "favoritos", "perfil"]) {
      expect(screen.getByTestId(`tab-${tab}`)).toBeTruthy();
    }
    expect(screen.queryByTestId("tab-mis-eventos")).toBeNull();
    expect(await screen.findByTestId("buscador")).toBeTruthy();
    expect(screen.getByTestId("logo")).toBeTruthy();
  });

  it("un organizador con sesión entra a sus tabs", async () => {
    conSesion(FENIX);
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/mis-eventos"));
    expect(screen.getByTestId("tab-mis-eventos")).toBeTruthy();
    expect(screen.getByTestId("tab-perfil")).toBeTruthy();
    expect(screen.queryByTestId("tab-explorar")).toBeNull();
    expect(await screen.findByTestId("logo")).toBeTruthy();
  });

  it("con la sesión vencida vuelve al login", async () => {
    leerSesion.mockResolvedValue({ token: "viejo", usuario: ANA });
    obtenerYo.mockRejectedValue(errorHttp(401, "Token inválido"));
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/login"));
  });

  it("sin sesión no se puede entrar a una ruta protegida", async () => {
    await abrirApp("/mis-compras");
    await waitFor(() => expect(screen).toHavePathname("/login"));
  });

  it("un comprador que navega a una ruta del organizador vuelve a sus tabs", async () => {
    conSesion(ANA);
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/explorar"));
    await act(() => router.push("/mis-eventos"));
    await waitFor(() => expect(screen).toHavePathname("/explorar"));
  });
});

describe("login y logout", () => {
  it("al ingresar como Ana va a Explorar y al cerrar sesión vuelve al login", async () => {
    login.mockResolvedValue({ token: "t", usuario: ANA });
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/login"));
    await fireEvent.press(screen.getByTestId("login-demo-ana@aiticket.com"));
    await fireEvent.press(screen.getByTestId("login-ingresar"));
    await waitFor(() => expect(screen).toHavePathname("/explorar"));

    await fireEvent.press(screen.getByTestId("tab-perfil"));
    await fireEvent.press(await screen.findByTestId("cerrar-sesion"));
    await waitFor(() => expect(screen).toHavePathname("/login"));
  });

  it("al ingresar como Fénix va a Mis eventos", async () => {
    login.mockResolvedValue({ token: "t", usuario: FENIX });
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/login"));
    await fireEvent.press(screen.getByTestId("login-demo-fenix@aiticket.com"));
    await fireEvent.press(screen.getByTestId("login-ingresar"));
    await waitFor(() => expect(screen).toHavePathname("/mis-eventos"));
  });
});

describe("detalle del evento", () => {
  it("un comprador va de Explorar al detalle y de ahí a Comprar", async () => {
    conSesion(ANA);
    await abrirApp();
    await fireEvent.press(await screen.findByTestId("tarjeta-evento-1"));
    await waitFor(() => expect(screen).toHavePathname("/eventos/1"));
    await fireEvent.press(await screen.findByTestId("evento-comprar"));
    await waitFor(() => expect(screen).toHavePathname("/eventos/1/comprar"));
    expect(await screen.findByTestId("comprar-confirmar")).toBeTruthy();
  });

  it("un organizador no puede entrar a Comprar", async () => {
    conSesion(FENIX);
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/mis-eventos"));
    await act(() => router.push("/eventos/1/comprar"));
    await waitFor(() => expect(screen).toHavePathname("/mis-eventos"));
    expect(screen.queryByTestId("comprar-confirmar")).toBeNull();
  });

  it("desde Mis compras se abre el detalle de una compra", async () => {
    conSesion(ANA);
    await abrirApp();
    await fireEvent.press(await screen.findByTestId("tab-mis-compras"));
    await fireEvent.press(await screen.findByTestId("compra-7"));
    await waitFor(() => expect(screen).toHavePathname("/compras/7"));
    expect(await screen.findByTestId("linea-de-tiempo")).toBeTruthy();
  });

  it("abrir en frío la ruta de una compra la conserva mientras se restaura la sesión", async () => {
    conSesion(ANA);
    await abrirApp("/compras/7");
    expect(await screen.findByTestId("linea-de-tiempo")).toBeTruthy();
    expect(screen).toHavePathname("/compras/7");
  });

  it("un organizador puede abrir el detalle de un evento", async () => {
    conSesion(FENIX);
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/mis-eventos"));
    await act(() => router.push("/eventos/1"));
    await waitFor(() => expect(screen).toHavePathname("/eventos/1"));
    expect(await screen.findByText("Los Piojos en River")).toBeTruthy();
  });

  it("desde Mis eventos el organizador abre las compras de un evento", async () => {
    conSesion(FENIX);
    await abrirApp();
    await fireEvent.press(await screen.findByTestId("evento-propio-1"));
    await waitFor(() => expect(screen).toHavePathname("/eventos/1/compras"));
    expect(await screen.findByTestId("disponibilidad-10")).toBeTruthy();
  });

  it("el organizador abre Nuevo evento desde Mis eventos", async () => {
    conSesion(FENIX);
    await abrirApp();
    await fireEvent.press(await screen.findByTestId("fab-nuevo-evento"));
    await waitFor(() => expect(screen).toHavePathname("/eventos/nuevo"));
    expect(await screen.findByTestId("evento-guardar")).toBeTruthy();
    expect(obtenerEvento).not.toHaveBeenCalled();
  });

  it("un comprador no puede entrar a Nuevo evento", async () => {
    conSesion(ANA);
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/explorar"));
    await act(() => router.push("/eventos/nuevo"));
    await waitFor(() => expect(screen).toHavePathname("/explorar"));
    expect(screen.queryByTestId("evento-guardar")).toBeNull();
  });

  it("un comprador no puede entrar a las compras de un evento", async () => {
    conSesion(ANA);
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/explorar"));
    await act(() => router.push("/eventos/1/compras"));
    await waitFor(() => expect(screen).toHavePathname("/explorar"));
    expect(listarComprasDelEvento).not.toHaveBeenCalled();
  });

  it.each([
    ["un comprador", ANA, "/explorar"],
    ["un organizador", FENIX, "/mis-eventos"],
  ])("%s abre el chat desde el detalle de la compra", async (_, usuario, inicio) => {
    conSesion(usuario);
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname(inicio));
    await act(() => router.push("/compras/7"));
    await fireEvent.press(await screen.findByTestId("compra-chat"));
    await waitFor(() => expect(screen).toHavePathname("/compras/7/chat"));
    expect(await screen.findByTestId("chat-vacio")).toBeTruthy();
  });

  it("sin sesión el detalle manda al login", async () => {
    await abrirApp("/eventos/1");
    await waitFor(() => expect(screen).toHavePathname("/login"));
  });
});

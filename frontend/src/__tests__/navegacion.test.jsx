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
import { leerSesion } from "../auth/sesion";
import { login, obtenerYo } from "../api/authApi";
import { buscarEventos, obtenerEvento } from "../api/eventosApi";
import { listarCategorias } from "../api/categoriasApi";
import { obtenerReseniasDeOrganizador } from "../api/organizadoresApi";
import { ANA, FENIX } from "../test-utils/renderConProviders";
import {
  errorHttp,
  eventoDetalle,
  eventoResumen,
  paginaDeEventos,
  reseniasDe,
} from "../test-utils/fixtures";

jest.mock("../auth/sesion");
jest.mock("../api/authApi");
jest.mock("../api/eventosApi");
jest.mock("../api/categoriasApi");
jest.mock("../api/organizadoresApi");

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
  });

  it("un organizador con sesión entra a sus tabs", async () => {
    conSesion(FENIX);
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/mis-eventos"));
    expect(screen.getByTestId("tab-mis-eventos")).toBeTruthy();
    expect(screen.getByTestId("tab-perfil")).toBeTruthy();
    expect(screen.queryByTestId("tab-explorar")).toBeNull();
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
    expect(screen.getByTestId("proximamente")).toBeTruthy();
  });

  it("un organizador puede abrir el detalle de un evento", async () => {
    conSesion(FENIX);
    await abrirApp();
    await waitFor(() => expect(screen).toHavePathname("/mis-eventos"));
    await act(() => router.push("/eventos/1"));
    await waitFor(() => expect(screen).toHavePathname("/eventos/1"));
    expect(await screen.findByText("Los Piojos en River")).toBeTruthy();
  });

  it("sin sesión el detalle manda al login", async () => {
    await abrirApp("/eventos/1");
    await waitFor(() => expect(screen).toHavePathname("/login"));
  });
});

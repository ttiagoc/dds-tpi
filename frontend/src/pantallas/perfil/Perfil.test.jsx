import { screen, fireEvent, waitFor } from "@testing-library/react-native";
import Perfil from "./Perfil";
import { borrarSesion } from "../../auth/sesion";
import { guardarPreferencia } from "../../tema/preferenciaTema";
import { renderConProviders, ANA, FENIX } from "../../test-utils/renderConProviders";

jest.mock("../../auth/sesion");
jest.mock("../../tema/preferenciaTema", () => ({
  ...jest.requireActual("../../tema/preferenciaTema"),
  leerPreferencia: jest.fn(async () => "claro"),
  guardarPreferencia: jest.fn(async () => {}),
}));

describe("Perfil", () => {
  it("muestra nombre completo, email y rol del comprador", async () => {
    await renderConProviders(<Perfil />, { usuario: ANA });
    expect(screen.getByTestId("perfil-nombre")).toHaveTextContent("Ana Pérez");
    expect(screen.getByTestId("perfil-email")).toHaveTextContent("ana@aiticket.com");
    expect(screen.getByTestId("perfil-rol")).toHaveTextContent("Comprador");
  });

  it("un organizador sin apellido muestra solo el nombre", async () => {
    await renderConProviders(<Perfil />, { usuario: FENIX });
    expect(screen.getByTestId("perfil-nombre")).toHaveTextContent("Fénix Producciones");
    expect(screen.getByTestId("perfil-rol")).toHaveTextContent("Organizador");
  });

  it("Cerrar sesión borra la sesión guardada", async () => {
    await renderConProviders(<Perfil />, { usuario: ANA });
    await fireEvent.press(screen.getByTestId("cerrar-sesion"));
    await waitFor(() => expect(borrarSesion).toHaveBeenCalled());
  });

  it("en Apariencia arranca en Claro y guarda la opción elegida", async () => {
    await renderConProviders(<Perfil />, { usuario: ANA });
    expect(screen.getByText("Apariencia")).toBeTruthy();
    expect(screen.getByTestId("tema-claro").props.accessibilityState).toMatchObject({
      checked: true,
    });
    await fireEvent.press(screen.getByTestId("tema-oscuro"));
    expect(guardarPreferencia).toHaveBeenCalledWith("oscuro");
    expect(screen.getByTestId("tema-oscuro").props.accessibilityState).toMatchObject({
      checked: true,
    });
  });
});

import { screen, fireEvent, waitFor } from "@testing-library/react-native";
import { AxiosError } from "axios";
import Login from "./Login";
import { login } from "../../api/authApi";
import { guardarSesion } from "../../auth/sesion";
import { renderConProviders, ANA } from "../../test-utils/renderConProviders";

jest.mock("../../api/authApi");
jest.mock("../../auth/sesion");

const CREDENCIALES = { email: "ana@aiticket.com", password: "Demo1234!" };

async function completar({ email, password }) {
  await fireEvent.changeText(screen.getByTestId("login-email"), email);
  await fireEvent.changeText(screen.getByTestId("login-password"), password);
}

const botonIngresar = () => screen.getByTestId("login-ingresar");

beforeEach(() => jest.clearAllMocks());

describe("Login", () => {
  it("Ingresar está deshabilitado mientras falte un campo", async () => {
    await renderConProviders(<Login />);
    expect(botonIngresar()).toBeDisabled();
    await completar({ email: "ana@aiticket.com", password: "" });
    expect(botonIngresar()).toBeDisabled();
    await completar(CREDENCIALES);
    expect(botonIngresar()).toBeEnabled();
  });

  it("ingresa con email (sin espacios) y contraseña y guarda la sesión", async () => {
    login.mockResolvedValue({ token: "t", usuario: ANA });
    await renderConProviders(<Login />);
    await completar({ ...CREDENCIALES, email: "  ana@aiticket.com " });
    await fireEvent.press(botonIngresar());
    await waitFor(() => expect(guardarSesion).toHaveBeenCalledWith({ token: "t", usuario: ANA }));
    expect(login).toHaveBeenCalledWith(CREDENCIALES);
  });

  it("Enter en la contraseña envía el formulario completo", async () => {
    login.mockResolvedValue({ token: "t", usuario: ANA });
    await renderConProviders(<Login />);
    await completar(CREDENCIALES);
    await fireEvent(screen.getByTestId("login-password"), "submitEditing");
    await waitFor(() => expect(login).toHaveBeenCalledWith(CREDENCIALES));
  });

  it("Enter con el formulario incompleto no envía", async () => {
    await renderConProviders(<Login />);
    await completar({ email: "ana@aiticket.com", password: "" });
    await fireEvent(screen.getByTestId("login-password"), "submitEditing");
    expect(login).not.toHaveBeenCalled();
  });

  it("muestra el error del back y conserva lo escrito", async () => {
    login.mockRejectedValue(
      new AxiosError("x", "ERR", {}, null, {
        status: 401,
        data: { message: "Email o contraseña incorrectos" },
      }),
    );
    await renderConProviders(<Login />);
    await completar({ email: "ana@aiticket.com", password: "mal" });
    await fireEvent.press(botonIngresar());
    expect(await screen.findByText("Email o contraseña incorrectos")).toBeTruthy();
    expect(screen.getByTestId("login-email").props.value).toBe("ana@aiticket.com");
    expect(botonIngresar()).toBeEnabled();
  });

  it("sin servidor muestra el error de conexión", async () => {
    login.mockRejectedValue(new AxiosError("Network Error", "ERR_NETWORK"));
    await renderConProviders(<Login />);
    await completar(CREDENCIALES);
    await fireEvent.press(botonIngresar());
    expect(await screen.findByText("No pudimos conectar con el servidor")).toBeTruthy();
  });

  it("mientras envía deshabilita Ingresar", async () => {
    let responder;
    login.mockReturnValue(new Promise((resolve) => (responder = resolve)));
    await renderConProviders(<Login />);
    await completar(CREDENCIALES);
    fireEvent.press(botonIngresar());
    await waitFor(() => expect(botonIngresar()).toBeDisabled());
    responder({ token: "t", usuario: ANA });
    await waitFor(() => expect(guardarSesion).toHaveBeenCalled());
  });

  it("el ojo muestra y oculta la contraseña", async () => {
    await renderConProviders(<Login />);
    expect(screen.getByTestId("login-password").props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByLabelText("Mostrar contraseña"));
    expect(screen.getByTestId("login-password").props.secureTextEntry).toBe(false);
  });

  it("los usuarios demo completan email y contraseña", async () => {
    await renderConProviders(<Login />);
    await fireEvent.press(screen.getByTestId("login-demo-fenix@aiticket.com"));
    expect(screen.getByTestId("login-email").props.value).toBe("fenix@aiticket.com");
    expect(screen.getByTestId("login-password").props.value).toBe("Demo1234!");
  });

  it("sin modo desarrollo no muestra los usuarios demo", async () => {
    await renderConProviders(<Login mostrarDemo={false} />);
    expect(screen.queryByTestId("login-demo-ana@aiticket.com")).toBeNull();
  });
});

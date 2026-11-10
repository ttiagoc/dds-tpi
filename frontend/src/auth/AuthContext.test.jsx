import { useEffect } from "react";
import { Text } from "react-native";
import { render, screen, waitFor, act } from "@testing-library/react-native";
import { AxiosError } from "axios";
import { AuthProvider, useAuth } from "./AuthContext";
import { leerSesion, guardarSesion, borrarSesion } from "./sesion";
import { login, obtenerYo } from "../api/authApi";
import { establecerToken, alExpirarSesion } from "../api/cliente";
import { ANA } from "../test-utils/renderConProviders";

jest.mock("./sesion");
jest.mock("../api/authApi");
jest.mock("../api/cliente", () => ({
  ...jest.requireActual("../api/cliente"),
  establecerToken: jest.fn(),
  alExpirarSesion: jest.fn(),
}));

const GUARDADA = { token: "guardado", usuario: { ...ANA, nombre: "Ana vieja" } };
const error401 = new AxiosError("x", "ERR", {}, null, { status: 401, data: {} });

const capturado = {};
function Espia() {
  const auth = useAuth();
  useEffect(() => {
    capturado.auth = auth;
  });
  return <Text>{auth.cargando ? "cargando" : (auth.usuario?.nombre ?? "sin sesión")}</Text>;
}

const montar = (props = {}) =>
  render(
    <AuthProvider {...props}>
      <Espia />
    </AuthProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  leerSesion.mockResolvedValue(null);
});

describe("AuthProvider al arrancar", () => {
  it("sin sesión guardada queda sin usuario", async () => {
    await montar();
    expect(await screen.findByText("sin sesión")).toBeTruthy();
    expect(obtenerYo).not.toHaveBeenCalled();
  });

  it("con sesión guardada la valida con /auth/yo y usa el usuario del back", async () => {
    leerSesion.mockResolvedValue(GUARDADA);
    obtenerYo.mockResolvedValue(ANA);
    await montar();
    expect(await screen.findByText("Ana")).toBeTruthy();
    expect(establecerToken).toHaveBeenCalledWith("guardado");
    expect(guardarSesion).toHaveBeenCalledWith({ token: "guardado", usuario: ANA });
  });

  it("si /auth/yo responde 401 borra la sesión", async () => {
    leerSesion.mockResolvedValue(GUARDADA);
    obtenerYo.mockRejectedValue(error401);
    await montar();
    expect(await screen.findByText("sin sesión")).toBeTruthy();
    expect(borrarSesion).toHaveBeenCalled();
    expect(establecerToken).toHaveBeenLastCalledWith(null);
  });

  it("si no hay red mantiene la sesión guardada", async () => {
    leerSesion.mockResolvedValue(GUARDADA);
    obtenerYo.mockRejectedValue(new AxiosError("Network Error", "ERR_NETWORK"));
    await montar();
    expect(await screen.findByText("Ana vieja")).toBeTruthy();
    expect(borrarSesion).not.toHaveBeenCalled();
  });

  it("con sesión inicial no lee el storage", async () => {
    await montar({ sesionInicial: { token: "t", usuario: ANA } });
    expect(screen.getByText("Ana")).toBeTruthy();
    expect(leerSesion).not.toHaveBeenCalled();
    expect(establecerToken).toHaveBeenCalledWith("t");
  });
});

describe("iniciar y cerrar sesión", () => {
  it("iniciarSesion llama al login, guarda la sesión y fija el token", async () => {
    login.mockResolvedValue({ token: "nuevo", usuario: ANA });
    await montar();
    await screen.findByText("sin sesión");
    await act(() =>
      capturado.auth.iniciarSesion({ email: "ana@aiticket.com", password: "Demo1234!" }),
    );
    expect(login).toHaveBeenCalledWith({ email: "ana@aiticket.com", password: "Demo1234!" });
    expect(guardarSesion).toHaveBeenCalledWith({ token: "nuevo", usuario: ANA });
    expect(establecerToken).toHaveBeenCalledWith("nuevo");
    expect(screen.getByText("Ana")).toBeTruthy();
  });

  it("si el login falla propaga el error y no guarda nada", async () => {
    login.mockRejectedValue(error401);
    await montar();
    await screen.findByText("sin sesión");
    await expect(act(() => capturado.auth.iniciarSesion({}))).rejects.toBe(error401);
    expect(guardarSesion).not.toHaveBeenCalled();
  });

  it("cerrarSesion borra la sesión y el token", async () => {
    await montar({ sesionInicial: { token: "t", usuario: ANA } });
    await act(() => capturado.auth.cerrarSesion());
    expect(borrarSesion).toHaveBeenCalled();
    expect(establecerToken).toHaveBeenLastCalledWith(null);
    expect(screen.getByText("sin sesión")).toBeTruthy();
  });

  it("un 401 de cualquier request cierra la sesión", async () => {
    await montar({ sesionInicial: { token: "t", usuario: ANA } });
    const alExpirar = alExpirarSesion.mock.calls.at(-1)[0];
    await act(() => alExpirar());
    await waitFor(() => expect(screen.getByText("sin sesión")).toBeTruthy());
    expect(borrarSesion).toHaveBeenCalled();
  });
});

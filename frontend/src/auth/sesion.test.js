import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { leerSesion, guardarSesion, borrarSesion } from "./sesion";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const SESION = { token: "abc", usuario: { id: 3, rol: "COMPRADOR" } };
const sistemaOriginal = Platform.OS;

afterEach(() => {
  Platform.OS = sistemaOriginal;
  jest.clearAllMocks();
  globalThis.localStorage?.clear();
});

describe("sesion en el celular (secure-store)", () => {
  beforeEach(() => {
    Platform.OS = "android";
  });

  it("guarda la sesión como JSON bajo la clave sesion", async () => {
    await guardarSesion(SESION);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("sesion", JSON.stringify(SESION));
  });

  it("lee la sesión guardada", async () => {
    SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(SESION));
    expect(await leerSesion()).toEqual(SESION);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("sesion");
  });

  it("devuelve null si no hay sesión o si lo guardado está roto", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null).mockResolvedValueOnce("{roto");
    expect(await leerSesion()).toBeNull();
    expect(await leerSesion()).toBeNull();
  });

  it("borra la sesión", async () => {
    await borrarSesion();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("sesion");
  });
});

function localStorageFalso() {
  const datos = new Map();
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => datos.set(clave, valor),
    removeItem: (clave) => datos.delete(clave),
    clear: () => datos.clear(),
  };
}

describe("sesion en web (localStorage)", () => {
  beforeEach(() => {
    Platform.OS = "web";
    globalThis.localStorage = localStorageFalso();
  });

  afterAll(() => {
    delete globalThis.localStorage;
  });

  it("guarda, lee y borra sin usar secure-store", async () => {
    await guardarSesion(SESION);
    expect(await leerSesion()).toEqual(SESION);
    await borrarSesion();
    expect(await leerSesion()).toBeNull();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});

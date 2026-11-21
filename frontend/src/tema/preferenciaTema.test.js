import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { esOscuro, guardarPreferencia, leerPreferencia } from "./preferenciaTema";

const sistemaOriginal = Platform.OS;

beforeEach(() => {
  Platform.OS = "ios";
  jest.clearAllMocks();
});

afterAll(() => {
  Platform.OS = sistemaOriginal;
});

describe("esOscuro", () => {
  it.each([
    ["claro", "dark", false],
    ["oscuro", "light", true],
    ["automatico", "dark", true],
    ["automatico", "light", false],
    ["automatico", null, false],
  ])("con %s y el celular en %s da %p", (preferencia, esquema, esperado) => {
    expect(esOscuro(preferencia, esquema)).toBe(esperado);
  });
});

describe("preferencia guardada", () => {
  it("sin nada guardado es claro", async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    expect(await leerPreferencia()).toBe("claro");
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("preferencia-tema");
  });

  it("lee la preferencia guardada", async () => {
    SecureStore.getItemAsync.mockResolvedValue("oscuro");
    expect(await leerPreferencia()).toBe("oscuro");
  });

  it("con un valor inválido o un error de lectura es claro", async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce("violeta").mockRejectedValueOnce(new Error("x"));
    expect(await leerPreferencia()).toBe("claro");
    expect(await leerPreferencia()).toBe("claro");
  });

  it("guarda la preferencia", async () => {
    await guardarPreferencia("automatico");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("preferencia-tema", "automatico");
  });
});

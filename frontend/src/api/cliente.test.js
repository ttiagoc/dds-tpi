import { AxiosError } from "axios";
import { cliente, establecerToken, alExpirarSesion, mensajeDeError } from "./cliente";

let pedidos;
let respuesta;

function errorHttp(config, status, data) {
  return new AxiosError("falla", "ERR_BAD_RESPONSE", config, null, { status, data, config });
}

beforeEach(() => {
  pedidos = [];
  respuesta = (config) => Promise.resolve({ data: { ok: true }, status: 200, config });
  cliente.defaults.adapter = (config) => {
    pedidos.push(config);
    return respuesta(config);
  };
  establecerToken(null);
  alExpirarSesion(() => {});
});

describe("cliente", () => {
  it("agrega el token como Bearer si hay sesión", async () => {
    establecerToken("abc");
    await cliente.get("/compras");
    expect(pedidos[0].headers.Authorization).toBe("Bearer abc");
  });

  it("no agrega Authorization sin sesión", async () => {
    await cliente.get("/eventos");
    expect(pedidos[0].headers.Authorization).toBeUndefined();
  });

  it("ante un 401 avisa que la sesión expiró", async () => {
    const alExpirar = jest.fn();
    alExpirarSesion(alExpirar);
    respuesta = (config) => Promise.reject(errorHttp(config, 401, { message: "Vencida" }));
    await expect(cliente.get("/compras")).rejects.toBeInstanceOf(AxiosError);
    expect(alExpirar).toHaveBeenCalledTimes(1);
  });

  it("un 401 del login no cierra la sesión", async () => {
    const alExpirar = jest.fn();
    alExpirarSesion(alExpirar);
    respuesta = (config) => Promise.reject(errorHttp(config, 401, { message: "Incorrecto" }));
    await expect(cliente.post("/auth/login", {})).rejects.toBeInstanceOf(AxiosError);
    expect(alExpirar).not.toHaveBeenCalled();
  });

  it("otros errores no cierran la sesión", async () => {
    const alExpirar = jest.fn();
    alExpirarSesion(alExpirar);
    respuesta = (config) => Promise.reject(errorHttp(config, 403, { message: "No" }));
    await expect(cliente.get("/compras/1")).rejects.toBeInstanceOf(AxiosError);
    expect(alExpirar).not.toHaveBeenCalled();
  });
});

describe("mensajeDeError", () => {
  it("devuelve el mensaje del back", () => {
    const error = errorHttp({}, 401, { message: "Email o contraseña incorrectos" });
    expect(mensajeDeError(error)).toBe("Email o contraseña incorrectos");
  });

  it("sin respuesta del servidor devuelve un mensaje de conexión", () => {
    expect(mensajeDeError(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(
      "No pudimos conectar con el servidor",
    );
    expect(mensajeDeError(new Error("x"))).toBe("No pudimos conectar con el servidor");
  });
});

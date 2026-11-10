import axios from "axios";

export const MENSAJE_SIN_CONEXION = "No pudimos conectar con el servidor";
const RUTA_LOGIN = "/auth/login";

export const cliente = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

let tokenActual = null;
let alExpirar = () => {};

export function establecerToken(token) {
  tokenActual = token;
}

export function alExpirarSesion(callback) {
  alExpirar = callback;
}

cliente.interceptors.request.use((config) => {
  if (tokenActual) config.headers.Authorization = `Bearer ${tokenActual}`;
  return config;
});

cliente.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== RUTA_LOGIN) alExpirar();
    return Promise.reject(error);
  },
);

export function mensajeDeError(error) {
  return error?.response?.data?.message ?? MENSAJE_SIN_CONEXION;
}

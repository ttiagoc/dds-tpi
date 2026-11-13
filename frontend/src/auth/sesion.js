import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const CLAVE = "sesion";

const almacenWeb = {
  leer: async () => globalThis.localStorage?.getItem(CLAVE) ?? null,
  escribir: async (valor) => globalThis.localStorage?.setItem(CLAVE, valor),
  borrar: async () => globalThis.localStorage?.removeItem(CLAVE),
};

const almacenNativo = {
  leer: () => SecureStore.getItemAsync(CLAVE),
  escribir: (valor) => SecureStore.setItemAsync(CLAVE, valor),
  borrar: () => SecureStore.deleteItemAsync(CLAVE),
};

const almacen = () => (Platform.OS === "web" ? almacenWeb : almacenNativo);

export async function leerSesion() {
  const guardada = await almacen().leer();
  if (!guardada) return null;
  try {
    return JSON.parse(guardada);
  } catch {
    return null;
  }
}

export const guardarSesion = (sesion) => almacen().escribir(JSON.stringify(sesion));

export const borrarSesion = () => almacen().borrar();

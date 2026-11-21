import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const almacenWeb = (clave) => ({
  leer: async () => globalThis.localStorage?.getItem(clave) ?? null,
  escribir: async (valor) => globalThis.localStorage?.setItem(clave, valor),
  borrar: async () => globalThis.localStorage?.removeItem(clave),
});

const almacenNativo = (clave) => ({
  leer: () => SecureStore.getItemAsync(clave),
  escribir: (valor) => SecureStore.setItemAsync(clave, valor),
  borrar: () => SecureStore.deleteItemAsync(clave),
});

export const almacenDe = (clave) =>
  Platform.OS === "web" ? almacenWeb(clave) : almacenNativo(clave);

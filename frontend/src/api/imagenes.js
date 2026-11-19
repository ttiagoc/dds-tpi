import { Platform } from "react-native";
import { cliente } from "./cliente";

export const urlDeImagen = (uri) =>
  uri?.startsWith("/") ? `${cliente.defaults.baseURL ?? ""}${uri}` : uri;

const archivoDe = (asset) =>
  asset.file ?? {
    uri: asset.uri,
    name: asset.fileName ?? "portada.jpg",
    type: asset.mimeType ?? "image/jpeg",
  };

export function subirImagen(asset) {
  const datos = new FormData();
  datos.append("imagen", archivoDe(asset));
  const opciones =
    Platform.OS === "web" ? {} : { headers: { "Content-Type": "multipart/form-data" } };
  return cliente.post("/imagenes", datos, opciones).then((respuesta) => respuesta.data.url);
}

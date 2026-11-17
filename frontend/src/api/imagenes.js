import { cliente } from "./cliente";

export const urlDeImagen = (uri) =>
  uri?.startsWith("/") ? `${cliente.defaults.baseURL ?? ""}${uri}` : uri;

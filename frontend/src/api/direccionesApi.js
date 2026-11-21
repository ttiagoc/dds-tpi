import { cliente } from "./cliente";

export const ubicarDireccion = (campos) =>
  cliente.get("/direcciones/ubicacion", { params: campos }).then((respuesta) => respuesta.data);

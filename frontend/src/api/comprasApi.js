import { cliente } from "./cliente";

export const crearCompra = (compra) =>
  cliente.post("/compras", compra).then((respuesta) => respuesta.data);

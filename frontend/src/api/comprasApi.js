import { cliente } from "./cliente";
import { sinVacios } from "./parametros";

export const crearCompra = (compra) =>
  cliente.post("/compras", compra).then((respuesta) => respuesta.data);

export const listarMisCompras = (criterio = {}) =>
  cliente.get("/compras", { params: sinVacios(criterio) }).then((respuesta) => respuesta.data);

export const obtenerCompra = (id) =>
  cliente.get(`/compras/${id}`).then((respuesta) => respuesta.data);

export const pagarCompra = (id) =>
  cliente.post(`/compras/${id}/pago`).then((respuesta) => respuesta.data);

export const cancelarCompra = (id) =>
  cliente.post(`/compras/${id}/cancelacion`).then((respuesta) => respuesta.data);

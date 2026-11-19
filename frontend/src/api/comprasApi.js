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

export const reseniarCompra = (id, resenia) =>
  cliente.post(`/compras/${id}/resenia`, resenia).then((respuesta) => respuesta.data);

export const marcarUtilizada = (id) =>
  cliente.post(`/compras/${id}/uso`).then((respuesta) => respuesta.data);

export const listarMensajes = (id, cursor = {}) =>
  cliente.get(`/compras/${id}/mensajes`, { params: cursor }).then((respuesta) => respuesta.data);

export const enviarMensaje = (id, mensaje) =>
  cliente.post(`/compras/${id}/mensajes`, { mensaje }).then((respuesta) => respuesta.data);

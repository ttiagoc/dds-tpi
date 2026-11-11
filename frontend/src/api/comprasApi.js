import { cliente } from "./cliente";
import { sinVacios } from "./parametros";

export const crearCompra = (compra) =>
  cliente.post("/compras", compra).then((respuesta) => respuesta.data);

export const listarMisCompras = (criterio = {}) =>
  cliente.get("/compras", { params: sinVacios(criterio) }).then((respuesta) => respuesta.data);

export const obtenerCompra = (id) =>
  cliente.get(`/compras/${id}`).then((respuesta) => respuesta.data);

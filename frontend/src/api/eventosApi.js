import { cliente } from "./cliente";
import { sinVacios } from "./parametros";

export const buscarEventos = (criterio = {}) =>
  cliente.get("/eventos", { params: sinVacios(criterio) }).then((respuesta) => respuesta.data);

export const obtenerEvento = (id) =>
  cliente.get(`/eventos/${id}`).then((respuesta) => respuesta.data);

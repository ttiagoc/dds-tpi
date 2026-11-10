import { cliente } from "./cliente";

const sinVacios = (parametros) =>
  Object.fromEntries(
    Object.entries(parametros).filter(([, valor]) => valor != null && valor !== ""),
  );

export const buscarEventos = (criterio = {}) =>
  cliente.get("/eventos", { params: sinVacios(criterio) }).then((respuesta) => respuesta.data);

export const obtenerEvento = (id) =>
  cliente.get(`/eventos/${id}`).then((respuesta) => respuesta.data);

import { cliente } from "./cliente";

export const listarConversaciones = (paginado = {}) =>
  cliente
    .get("/usuarios/yo/conversaciones", { params: paginado })
    .then((respuesta) => respuesta.data);

export const marcarLeidos = (compraId) =>
  cliente.put(`/compras/${compraId}/mensajes/leidos`).then(() => undefined);

import { cliente } from "./cliente";

export const obtenerReseniasDeOrganizador = (id, paginado = {}) =>
  cliente
    .get(`/organizadores/${id}/resenias`, { params: paginado })
    .then((respuesta) => respuesta.data);

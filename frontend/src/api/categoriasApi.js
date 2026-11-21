import { cliente } from "./cliente";
import { sinVacios } from "./parametros";

export const listarCategorias = (criterio = {}) =>
  cliente.get("/categorias", { params: sinVacios(criterio) }).then((respuesta) => respuesta.data);

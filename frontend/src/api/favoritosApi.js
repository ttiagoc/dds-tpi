import { cliente } from "./cliente";

export const listarFavoritos = (paginado = {}) =>
  cliente.get("/usuarios/yo/favoritos", { params: paginado }).then((respuesta) => respuesta.data);

const ruta = (eventoId) => `/usuarios/yo/favoritos/${eventoId}`;

export const agregarFavorito = (eventoId) => cliente.put(ruta(eventoId)).then(() => undefined);

export const quitarFavorito = (eventoId) => cliente.delete(ruta(eventoId)).then(() => undefined);

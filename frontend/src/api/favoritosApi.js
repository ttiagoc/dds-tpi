import { cliente } from "./cliente";

const ruta = (eventoId) => `/usuarios/yo/favoritos/${eventoId}`;

export const agregarFavorito = (eventoId) => cliente.put(ruta(eventoId)).then(() => undefined);

export const quitarFavorito = (eventoId) => cliente.delete(ruta(eventoId)).then(() => undefined);

import { textoRequerido } from "./validaciones.js";

export class Categoria {
  constructor({ id = null, nombre, descripcion = "" }) {
    this.id = id;
    this.nombre = textoRequerido(nombre, "La categoría necesita un nombre");
    this.descripcion = descripcion;
  }
}

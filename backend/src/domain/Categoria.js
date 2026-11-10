import { exigir, esTextoNoVacio } from "./validaciones.js";

export class Categoria {
  constructor({ id = null, nombre, descripcion = "" }) {
    exigir(esTextoNoVacio(nombre), "La categoría necesita un nombre");
    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = descripcion;
  }
}

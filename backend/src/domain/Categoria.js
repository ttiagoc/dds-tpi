import { normalizar } from "./texto.js";
import { textoRequerido } from "./validaciones.js";

export class Categoria {
  constructor({ id = null, nombre, descripcion = "" }) {
    this.id = id;
    this.nombre = textoRequerido(nombre, "La categoría necesita un nombre");
    this.descripcion = descripcion;
  }

  coincideCon(texto) {
    return normalizar(this.nombre).includes(normalizar(texto ?? "").trim());
  }

  static compararPorNombre(a, b) {
    return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }) || a.id - b.id;
  }
}

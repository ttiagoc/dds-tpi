import { UnprocessableEntityError } from "../errors/AppError.js";
import { exigir, esTextoNoVacio } from "./validaciones.js";

const esEnteroPositivo = (valor) => Number.isInteger(valor) && valor >= 1;

export class TipoEntrada {
  constructor({ id = null, nombre, descripcion = "", precio, cupo, vendidas = 0 }) {
    exigir(esTextoNoVacio(nombre), "El tipo de entrada necesita un nombre");
    exigir(Number.isFinite(precio), "El precio no es válido");
    exigir(precio >= 0, "El precio no puede ser negativo");
    exigir(esEnteroPositivo(cupo), "El cupo tiene que ser un entero mayor a 0");
    exigir(
      Number.isInteger(vendidas) && vendidas >= 0 && vendidas <= cupo,
      "Las entradas vendidas tienen que estar entre 0 y el cupo",
    );
    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = descripcion;
    this.precio = precio;
    this.cupo = cupo;
    this.vendidas = vendidas;
  }

  disponibles() {
    return this.cupo - this.vendidas;
  }

  hayCupoPara(cantidad) {
    return esEnteroPositivo(cantidad) && cantidad <= this.disponibles();
  }

  reservar(cantidad) {
    if (!this.hayCupoPara(cantidad)) {
      throw new UnprocessableEntityError(`No hay cupo suficiente para ${this.nombre}`);
    }
    this.vendidas += cantidad;
  }

  liberar(cantidad) {
    exigir(esEnteroPositivo(cantidad), "La cantidad a liberar tiene que ser un entero mayor a 0");
    this.vendidas = Math.max(0, this.vendidas - cantidad);
  }
}

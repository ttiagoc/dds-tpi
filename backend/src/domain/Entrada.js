import { exigir, esEnteroPositivo } from "./validaciones.js";

export class Entrada {
  constructor({ numero, fechaUso = null }) {
    exigir(esEnteroPositivo(numero), "El número de entrada tiene que ser un entero mayor a 0");
    this.numero = numero;
    this.fechaUso = fechaUso === null ? null : new Date(fechaUso);
  }

  static paraCompra(cantidad) {
    return Array.from({ length: cantidad }, (_, i) => new Entrada({ numero: i + 1 }));
  }

  estaUsada() {
    return this.fechaUso !== null;
  }

  usar(ahora) {
    exigir(!this.estaUsada(), "Esta entrada ya fue utilizada");
    this.fechaUso = ahora;
  }
}

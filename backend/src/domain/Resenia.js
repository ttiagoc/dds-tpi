import { exigir, textoEntre, fechaValida } from "./validaciones.js";

export class Resenia {
  constructor({ id = null, comprador, evento, compraId, puntuacion, detalle, fecha }) {
    exigir(compraId != null, "La reseña necesita una compra");
    exigir(comprador, "La reseña necesita un comprador");
    exigir(evento, "La reseña necesita un evento");
    exigir(
      Number.isInteger(puntuacion) && puntuacion >= 1 && puntuacion <= 5,
      "La puntuación tiene que ser un entero de 1 a 5",
    );
    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.compraId = compraId;
    this.puntuacion = puntuacion;
    this.detalle = textoEntre(
      detalle,
      1,
      500,
      "La reseña tiene que tener entre 1 y 500 caracteres",
    );
    this.fecha = fechaValida(fecha, "La fecha de la reseña no es válida");
  }

  static crear({ compra, puntuacion, detalle }, ahora) {
    exigir(compra.puedeReseniarse(), "Solo podés reseñar una compra utilizada");
    return new Resenia({
      comprador: compra.comprador,
      evento: compra.evento,
      compraId: compra.id,
      puntuacion,
      detalle,
      fecha: ahora,
    });
  }

  static promedio(resenias) {
    if (resenias.length === 0) return null;
    const suma = resenias.reduce((total, r) => total + r.puntuacion, 0);
    return Math.round((suma / resenias.length) * 10) / 10;
  }
}

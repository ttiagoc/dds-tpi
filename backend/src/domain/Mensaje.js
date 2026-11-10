import { textoEntre, fechaValida } from "./validaciones.js";

export class Mensaje {
  constructor({ id = null, usuario, mensaje, enviado }) {
    this.id = id;
    this.usuario = usuario;
    this.mensaje = textoEntre(
      mensaje,
      1,
      500,
      "El mensaje tiene que tener entre 1 y 500 caracteres",
    );
    this.enviado = fechaValida(enviado, "La fecha del mensaje no es válida");
  }
}

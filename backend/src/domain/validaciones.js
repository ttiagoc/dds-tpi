import { UnprocessableEntityError } from "../errors/AppError.js";

export function exigir(condicion, mensaje) {
  if (!condicion) throw new UnprocessableEntityError(mensaje);
}

export const esTextoNoVacio = (valor) => typeof valor === "string" && valor.trim().length > 0;

export function textoEntre(valor, min, max, mensaje) {
  exigir(typeof valor === "string", mensaje);
  const limpio = valor.trim();
  exigir(limpio.length >= min && limpio.length <= max, mensaje);
  return limpio;
}

export function fechaValida(valor, mensaje) {
  exigir(valor instanceof Date || typeof valor === "string", mensaje);
  const fecha = new Date(valor);
  exigir(!Number.isNaN(fecha.getTime()), mensaje);
  return fecha;
}

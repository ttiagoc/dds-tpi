import { exigir, exigirCampo } from "./validaciones.js";

export const MENSAJE_DIRECCION_INVALIDA =
  "La dirección tiene que ser 'Calle y número, localidad, provincia'";
export const MENSAJE_UBICACION_INVALIDA = "La ubicación del evento no es válida";

export const partesDeDireccion = (direccion) =>
  direccion
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean);

function tieneFormato(direccion) {
  if (typeof direccion !== "string") return false;
  const partes = partesDeDireccion(direccion);
  return partes.length >= 2 && /\d/.test(partes[0]);
}

export function direccionValida(direccion) {
  exigirCampo(tieneFormato(direccion), "direccion", MENSAJE_DIRECCION_INVALIDA);
  return direccion.trim();
}

const enRango = (valor, limite) => Number.isFinite(valor) && Math.abs(valor) <= limite;

export function ubicacionValida(ubicacion) {
  if (ubicacion == null) return null;
  const { latitud, longitud } = ubicacion;
  exigir(enRango(latitud, 90) && enRango(longitud, 180), MENSAJE_UBICACION_INVALIDA);
  return { latitud, longitud };
}

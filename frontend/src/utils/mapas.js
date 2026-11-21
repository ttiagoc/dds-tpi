const GOOGLE_MAPS = "https://www.google.com/maps";

export function urlComoLlegar({ direccion, ubicacion }) {
  if (ubicacion) {
    return `${GOOGLE_MAPS}/dir/?api=1&destination=${ubicacion.latitud},${ubicacion.longitud}`;
  }
  return `${GOOGLE_MAPS}/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

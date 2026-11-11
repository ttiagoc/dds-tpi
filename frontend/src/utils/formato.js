const LOCALE = "es-AR";

const precio = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatearFecha(fecha, { zonaHoraria } = {}) {
  const partes = new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: zonaHoraria,
  }).formatToParts(new Date(fecha));
  const parte = (tipo) => partes.find((p) => p.type === tipo)?.value.replace(".", "");
  return `${parte("weekday")} ${parte("day")} ${parte("month")} · ${parte("hour")}:${parte("minute")}`;
}

export const formatearPrecio = (monto) => precio.format(monto);

export const textoDisponibilidad = (disponibles) =>
  disponibles === 0 ? "Agotado" : `Quedan ${disponibles}`;

const puntaje = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });

export const formatearPuntaje = (valor) => puntaje.format(valor);

export function formatearDia(fecha, { zonaHoraria } = {}) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: zonaHoraria,
  })
    .format(new Date(fecha))
    .replaceAll(".", "")
    .replaceAll(" de ", " ");
}

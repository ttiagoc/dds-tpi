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

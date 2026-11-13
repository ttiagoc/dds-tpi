const LOCALE = "es-AR";

const precio = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function partesDeFecha(fecha, opciones, zonaHoraria) {
  const partes = new Intl.DateTimeFormat(LOCALE, {
    ...opciones,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: zonaHoraria,
  }).formatToParts(new Date(fecha));
  return (tipo) => partes.find((p) => p.type === tipo)?.value;
}

export function formatearFecha(fecha, { zonaHoraria } = {}) {
  const valor = partesDeFecha(
    fecha,
    { weekday: "short", day: "numeric", month: "short" },
    zonaHoraria,
  );
  const parte = (tipo) => valor(tipo)?.replace(".", "");
  return `${parte("weekday")} ${parte("day")} ${parte("month")} · ${parte("hour")}:${parte("minute")}`;
}

export const formatearPrecio = (monto) => precio.format(monto);

export function textoDiasRestantes(dias) {
  if (dias == null) return null;
  if (dias === 0) return "Es hoy";
  return dias === 1 ? "Falta 1 día" : `Faltan ${dias} días`;
}

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

export function formatearFechaCorta(fecha, { zonaHoraria } = {}) {
  const valor = partesDeFecha(fecha, { day: "numeric", month: "numeric" }, zonaHoraria);
  const parte = (tipo) => valor(tipo)?.padStart(2, "0");
  return `${parte("day")}/${parte("month")} ${parte("hour")}:${parte("minute")}`;
}

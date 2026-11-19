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

const sinPunto = (texto) => texto?.replace(".", "").toLocaleUpperCase(LOCALE);

export function partesDelBloqueFecha(fecha, { zonaHoraria } = {}) {
  const valor = partesDeFecha(
    fecha,
    { weekday: "short", day: "numeric", month: "short" },
    zonaHoraria,
  );
  return {
    diaSemana: sinPunto(valor("weekday")),
    dia: valor("day"),
    mes: sinPunto(valor("month"))?.slice(0, 3),
    hora: `${valor("hour")}:${valor("minute")}`,
  };
}

const diaCalendario = (fecha, zonaHoraria) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: zonaHoraria }).format(new Date(fecha));

const diasEntre = (desde, hasta, zonaHoraria) =>
  Math.round(
    (new Date(diaCalendario(hasta, zonaHoraria)) - new Date(diaCalendario(desde, zonaHoraria))) /
      (24 * 60 * 60 * 1000),
  );

const conMayuscula = (texto) => texto.charAt(0).toLocaleUpperCase(LOCALE) + texto.slice(1);

export function formatearMomento(fecha, { ahora = new Date(), zonaHoraria } = {}) {
  const dias = diasEntre(fecha, ahora, zonaHoraria);
  const valor = partesDeFecha(
    fecha,
    { weekday: "short", day: "numeric", month: "short" },
    zonaHoraria,
  );
  if (dias <= 0) return `${valor("hour")}:${valor("minute")}`;
  if (dias === 1) return "Ayer";
  if (dias < 7) return conMayuscula(valor("weekday").replace(".", ""));
  return `${valor("day")} ${valor("month").replace(".", "")}`;
}

export function formatearFechaCorta(fecha, { zonaHoraria } = {}) {
  const valor = partesDeFecha(fecha, { day: "numeric", month: "numeric" }, zonaHoraria);
  const parte = (tipo) => valor(tipo)?.padStart(2, "0");
  return `${parte("day")}/${parte("month")} ${parte("hour")}:${parte("minute")}`;
}

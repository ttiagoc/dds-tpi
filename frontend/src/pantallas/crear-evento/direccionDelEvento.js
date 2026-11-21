export const CAMPOS_DIRECCION = ["calle", "numero", "localidad", "provincia"];

export const direccionVacia = () => ({
  calle: "",
  numero: "",
  localidad: "",
  provincia: null,
  ubicacion: null,
  mapaNoDisponible: false,
});

export const MENSAJES_DIRECCION = {
  calle: "Indicá la calle",
  numero: "Ingresá el número de la calle",
  localidad: "Indicá la localidad o el barrio",
  provincia: "Elegí la provincia",
  ubicacion: "Confirmá la ubicación en el mapa",
};

const conTexto = (valor) => valor.trim().length > 0;
const numeroValido = (valor) => /^\d{1,5}$/.test(valor.trim()) && Number(valor) >= 1;

export function erroresDeDireccion({ calle, numero, localidad, provincia }) {
  return [
    ["calle", !conTexto(calle) && MENSAJES_DIRECCION.calle],
    ["numero", !numeroValido(numero) && MENSAJES_DIRECCION.numero],
    ["localidad", !conTexto(localidad) && MENSAJES_DIRECCION.localidad],
    ["provincia", !provincia && MENSAJES_DIRECCION.provincia],
  ];
}

export const direccionCompleta = (valores) =>
  erroresDeDireccion(valores).every(([, mensaje]) => !mensaje);

export function errorDeConfirmacion({ ubicacion, mapaNoDisponible }) {
  if (mapaNoDisponible || ubicacion?.confirmada) return null;
  return MENSAJES_DIRECCION.ubicacion;
}

export const camposParaBuscar = ({ calle, numero, localidad, provincia }) => ({
  calle: calle.trim(),
  numero: numero.trim(),
  localidad: localidad.trim(),
  provincia,
});

export function armarDireccion(valores) {
  const { calle, numero, localidad, provincia } = camposParaBuscar(valores);
  return `${calle} ${numero}, ${localidad}, ${provincia}`;
}

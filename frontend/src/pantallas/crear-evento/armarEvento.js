export const MAXIMO_TIPOS = 10;

export const tipoVacio = (clave) => ({ clave, nombre: "", precio: "", cupo: "", descripcion: "" });

export const formularioVacio = () => ({
  nombre: "",
  descripcion: "",
  lugar: "",
  direccion: "",
  imagen: "",
  categoria: null,
  dia: null,
  hora: null,
  tipos: [tipoVacio(0)],
});

export const MENSAJES = {
  nombre: "El nombre tiene que tener entre 3 y 100 caracteres",
  descripcion: "Escribí una descripción",
  lugar: "Indicá el lugar",
  direccion: "La dirección tiene que ser 'Calle y número, localidad, provincia'",
  categoria: "Elegí una categoría",
  fecha: "Elegí la fecha",
  hora: "Elegí la hora",
  futura: "La fecha del evento tiene que ser futura",
  tipoNombre: "Poné un nombre",
  precio: "Ingresá un precio válido",
  cupo: "El cupo tiene que ser un número entero mayor a 0",
};

const conTexto = (valor) => valor.trim().length > 0;
const aNumero = (valor) => (conTexto(valor) ? Number(valor.trim().replace(",", ".")) : NaN);
const precioValido = (valor) => Number.isFinite(aNumero(valor)) && aNumero(valor) >= 0;
const cupoValido = (valor) => Number.isInteger(aNumero(valor)) && aNumero(valor) >= 1;

function direccionConFormato(direccion) {
  const partes = direccion
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean);
  return partes.length >= 2 && /\d/.test(partes[0]);
}

export const claveDeTipo = (indice, campo) => `tiposEntrada.${indice}.${campo}`;

function fechaLocal(dia, { hours, minutes }) {
  return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hours, minutes);
}

function erroresDeTipo(tipo, indice) {
  return [
    [claveDeTipo(indice, "nombre"), !conTexto(tipo.nombre) && MENSAJES.tipoNombre],
    [claveDeTipo(indice, "precio"), !precioValido(tipo.precio) && MENSAJES.precio],
    [claveDeTipo(indice, "cupo"), !cupoValido(tipo.cupo) && MENSAJES.cupo],
  ];
}

function errorDeFecha({ dia, hora }, ahora) {
  if (!dia) return MENSAJES.fecha;
  if (hora && fechaLocal(dia, hora) <= ahora) return MENSAJES.futura;
  return null;
}

export function validarEvento(formulario, ahora) {
  const { nombre, descripcion, lugar, direccion, categoria, hora, tipos } = formulario;
  const largo = nombre.trim().length;
  const errores = [
    ["nombre", (largo < 3 || largo > 100) && MENSAJES.nombre],
    ["descripcion", !conTexto(descripcion) && MENSAJES.descripcion],
    ["lugar", !conTexto(lugar) && MENSAJES.lugar],
    ["direccion", !direccionConFormato(direccion) && MENSAJES.direccion],
    ["categoria", !categoria && MENSAJES.categoria],
    ["fecha", errorDeFecha(formulario, ahora)],
    ["hora", !hora && MENSAJES.hora],
    ...tipos.flatMap(erroresDeTipo),
  ];
  return Object.fromEntries(errores.filter(([, mensaje]) => mensaje));
}

const CAMPOS_DEL_BACK = { categoriaId: "categoria" };

export function erroresDelBack(detalles) {
  return Object.fromEntries(
    (detalles ?? []).map(({ campo, mensaje }) => [CAMPOS_DEL_BACK[campo] ?? campo, mensaje]),
  );
}

function armarTipo({ nombre, precio, cupo, descripcion }) {
  const tipo = { nombre: nombre.trim(), precio: aNumero(precio), cupo: aNumero(cupo) };
  return conTexto(descripcion) ? { ...tipo, descripcion: descripcion.trim() } : tipo;
}

export function armarEvento(formulario) {
  const { nombre, descripcion, lugar, direccion, imagen, categoria, dia, hora, tipos } = formulario;
  return {
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    categoriaId: categoria.id,
    fecha: fechaLocal(dia, hora).toISOString(),
    lugar: lugar.trim(),
    direccion: direccion.trim(),
    multimedia: conTexto(imagen) ? [imagen.trim()] : [],
    tiposEntrada: tipos.map(armarTipo),
  };
}

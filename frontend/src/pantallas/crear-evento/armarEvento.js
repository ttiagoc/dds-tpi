export const MAXIMO_TIPOS = 10;

export const tipoVacio = (clave) => ({ clave, nombre: "", precio: "", cupo: "", descripcion: "" });

export const formularioVacio = () => ({
  nombre: "",
  descripcion: "",
  lugar: "",
  imagen: "",
  categoria: null,
  dia: null,
  hora: null,
  tipos: [tipoVacio(0)],
});

const conTexto = (valor) => valor.trim().length > 0;
const esNumero = (valor) => conTexto(valor) && Number.isFinite(Number(valor));

const tipoCompleto = (tipo) =>
  conTexto(tipo.nombre) && esNumero(tipo.precio) && esNumero(tipo.cupo);

export function estaCompleto(formulario) {
  const { nombre, descripcion, lugar, categoria, dia, hora, tipos } = formulario;
  const textos = [nombre, descripcion, lugar].every(conTexto);
  return textos && !!categoria && !!dia && !!hora && tipos.every(tipoCompleto);
}

function armarTipo({ nombre, precio, cupo, descripcion }) {
  const tipo = { nombre: nombre.trim(), precio: Number(precio), cupo: Number(cupo) };
  return conTexto(descripcion) ? { ...tipo, descripcion: descripcion.trim() } : tipo;
}

function fechaLocal(dia, { hours, minutes }) {
  return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hours, minutes).toISOString();
}

export function armarEvento(formulario) {
  const { nombre, descripcion, lugar, imagen, categoria, dia, hora, tipos } = formulario;
  return {
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    categoriaId: categoria.id,
    fecha: fechaLocal(dia, hora),
    lugar: lugar.trim(),
    multimedia: conTexto(imagen) ? [imagen.trim()] : [],
    tiposEntrada: tipos.map(armarTipo),
  };
}

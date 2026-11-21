import { NotFoundError } from "../errors/AppError.js";
import { Rol } from "./Rol.js";
import { TipoEntrada } from "./TipoEntrada.js";
import { normalizar } from "./texto.js";
import { direccionValida, ubicacionValida } from "./direccion.js";
import {
  exigir,
  exigirCampo,
  esTextoNoVacio,
  textoEntre,
  textoRequerido,
  fechaValida,
} from "./validaciones.js";

function armarTipos(tiposEntrada) {
  exigir(
    Array.isArray(tiposEntrada) && tiposEntrada.length > 0,
    "El evento necesita al menos un tipo de entrada",
  );
  const tipos = tiposEntrada.map((t) => (t instanceof TipoEntrada ? t : new TipoEntrada(t)));

  const vistos = new Set();
  for (const tipo of tipos) {
    const clave = normalizar(tipo.nombre);
    exigir(!vistos.has(clave), `Ya hay un tipo de entrada llamado ${tipo.nombre}`);
    vistos.add(clave);
  }

  const ids = tipos.map((t) => t.id).filter((id) => id != null);
  exigir(new Set(ids).size === ids.length, "Hay tipos de entrada con el id repetido");

  let siguienteId = Math.max(0, ...ids) + 1;
  for (const tipo of tipos) {
    if (tipo.id == null) tipo.id = siguienteId++;
  }
  return tipos;
}

function armarMultimedia(multimedia) {
  const lista = multimedia ?? [];
  exigir(
    Array.isArray(lista) && lista.every(esTextoNoVacio),
    "Las imágenes del evento tienen que ser URLs",
  );
  return [...lista];
}

export class Evento {
  constructor({
    id = null,
    nombre,
    descripcion,
    categoria,
    fecha,
    lugar,
    direccion,
    ubicacion = null,
    tiposEntrada,
    multimedia = [],
    organizador,
  }) {
    this.id = id;
    this.nombre = textoEntre(
      nombre,
      3,
      100,
      "El nombre del evento tiene que tener entre 3 y 100 caracteres",
    );
    this.descripcion = textoRequerido(descripcion, "El evento necesita una descripción");
    exigir(categoria, "El evento necesita una categoría");
    this.categoria = categoria;
    this.fecha = fechaValida(fecha, "La fecha del evento no es válida");
    this.lugar = textoRequerido(lugar, "El evento necesita un lugar");
    this.direccion = direccionValida(direccion);
    this.ubicacion = ubicacionValida(ubicacion);
    this.tiposEntrada = armarTipos(tiposEntrada);
    this.multimedia = armarMultimedia(multimedia);
    exigir(
      organizador?.rol === Rol.ORGANIZADOR,
      "El organizador del evento tiene que tener rol ORGANIZADOR",
    );
    this.organizador = organizador;
  }

  static crear(datos, ahora) {
    const evento = new Evento(datos);
    exigirCampo(!evento.yaOcurrio(ahora), "fecha", "La fecha del evento tiene que ser futura");
    exigir(evento.totalVendidas() === 0, "Un evento nuevo no puede tener entradas vendidas");
    return evento;
  }

  ubicarEn(ubicacion) {
    this.ubicacion = ubicacionValida(ubicacion);
  }

  tipoEntrada(id) {
    const tipo = this.tiposEntrada.find((t) => t.id === id);
    if (!tipo) throw new NotFoundError(`No existe el tipo de entrada ${id} en este evento`);
    return tipo;
  }

  yaOcurrio(ahora) {
    return this.fecha.getTime() <= ahora.getTime();
  }

  static compararPorFecha(a, b) {
    return a.fecha.getTime() - b.fecha.getTime() || a.id - b.id;
  }

  esDe(usuarioId) {
    return this.organizador.id === usuarioId;
  }

  precioMinimo() {
    return Math.min(...this.tiposEntrada.map((t) => t.precio));
  }

  tuPrecioEstaEntre(min, max) {
    return this.tiposEntrada.some(
      (t) => (min == null || t.precio >= min) && (max == null || t.precio <= max),
    );
  }

  coincideCon(texto) {
    const buscado = normalizar(texto ?? "").trim();
    return [this.nombre, this.descripcion].some((campo) => normalizar(campo).includes(buscado));
  }

  totalVendidas() {
    return this.tiposEntrada.reduce((total, t) => total + t.vendidas, 0);
  }

  cupoTotal() {
    return this.tiposEntrada.reduce((total, t) => total + t.cupo, 0);
  }
}

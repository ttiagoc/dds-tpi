import { AxiosError } from "axios";

export function eventoResumen(cambios = {}) {
  return {
    id: 1,
    nombre: "Los Piojos en River",
    fecha: "2026-12-20T23:00:00.000Z",
    lugar: "Estadio River Plate",
    categoria: { id: 1, nombre: "Recitales" },
    precioDesde: 45000,
    imagen: "https://imagenes.test/piojos.jpg",
    organizador: { id: 2, nombre: "Fénix Producciones", puntajePromedio: 4.5 },
    esFavorito: false,
    ...cambios,
  };
}

export function eventoDetalle(cambios = {}) {
  return {
    ...eventoResumen(),
    descripcion: "La vuelta de Los Piojos al Monumental.",
    multimedia: ["https://imagenes.test/piojos.jpg"],
    tiposEntrada: [
      { id: 10, nombre: "Campo", descripcion: "De pie", precio: 45000, cupo: 100, disponibles: 40 },
      { id: 11, nombre: "Platea", descripcion: "Sentado", precio: 80000, cupo: 50, disponibles: 0 },
    ],
    ...cambios,
  };
}

export function paginaDeEventos(eventos, { page = 1, totalPages = 1, total } = {}) {
  return { eventos, total: total ?? eventos.length, page, totalPages };
}

export function resenia(cambios = {}) {
  return {
    id: 1,
    compraId: 5,
    puntuacion: 5,
    detalle: "Impecable la organización",
    fecha: "2026-10-01T12:00:00.000Z",
    evento: { id: 9, nombre: "Rock en el Parque" },
    comprador: { nombre: "Bruno" },
    ...cambios,
  };
}

export function reseniasDe(resenias, organizador = {}) {
  return {
    organizador: {
      id: 2,
      nombre: "Fénix Producciones",
      puntajePromedio: 4.5,
      cantidadResenias: 12,
      ...organizador,
    },
    resenias,
    total: resenias.length,
    page: 1,
    totalPages: 1,
  };
}

export function errorHttp(status, message) {
  return new AxiosError("x", "ERR", {}, null, { status, data: { message } });
}

export function promesaManual() {
  let resolver;
  let rechazar;
  const promesa = new Promise((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

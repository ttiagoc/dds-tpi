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

export function compraResumen(cambios = {}) {
  return {
    id: 7,
    estado: "CONFIRMADA",
    cantidad: 2,
    total: 90000,
    fechaCompra: "2026-11-01T15:00:00.000Z",
    diasRestantes: 12,
    evento: {
      id: 1,
      nombre: "Los Piojos en River",
      fecha: "2026-12-20T23:00:00.000Z",
      lugar: "Estadio River Plate",
      imagen: "https://imagenes.test/piojos.jpg",
    },
    tipoEntrada: { id: 10, nombre: "Campo", precio: 45000 },
    comprador: { id: 1, nombre: "Ana Pérez" },
    acciones: {
      puedePagar: false,
      puedeCancelar: true,
      puedeMarcarUtilizada: false,
      puedeReseniar: false,
    },
    ...cambios,
  };
}

export function compraDetalle(cambios = {}) {
  return {
    ...compraResumen(),
    historial: [
      {
        estado: "PENDIENTE",
        quien: { id: 1, nombre: "Ana Pérez" },
        fechaHora: "2026-11-01T15:00:00.000Z",
      },
      {
        estado: "CONFIRMADA",
        quien: { id: 1, nombre: "Ana Pérez" },
        fechaHora: "2026-11-01T15:05:00.000Z",
      },
    ],
    resenia: null,
    ...cambios,
  };
}

export function paginaDeCompras(compras, { page = 1, totalPages = 1, total } = {}) {
  return { compras, total: total ?? compras.length, page, totalPages };
}

export function eventoPropio(cambios = {}) {
  return {
    ...eventoResumen({ esFavorito: false }),
    vendidas: 60,
    cupo: 150,
    recaudado: 2700000,
    ...cambios,
  };
}

export function comprasDelEvento(compras, cambios = {}) {
  return {
    evento: { id: 1, nombre: "Los Piojos en River" },
    disponibilidad: [
      { tipoEntradaId: 10, nombre: "Campo", cupo: 100, vendidas: 60, disponibles: 40 },
      { tipoEntradaId: 11, nombre: "Platea", cupo: 50, vendidas: 50, disponibles: 0 },
    ],
    compras,
    total: compras.length,
    page: 1,
    totalPages: 1,
    ...cambios,
  };
}

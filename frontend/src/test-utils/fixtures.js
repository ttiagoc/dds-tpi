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
    finalizado: false,
    ...cambios,
  };
}

export function eventoDetalle(cambios = {}) {
  return {
    ...eventoResumen(),
    descripcion: "La vuelta de Los Piojos al Monumental.",
    direccion: "Av. Figueroa Alcorta 7597, CABA, Buenos Aires",
    ubicacion: { latitud: -34.5453, longitud: -58.4498 },
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

export function errorHttp(status, message, details) {
  return new AxiosError("x", "ERR", {}, null, { status, data: { message, details } });
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
      organizador: { id: 2, nombre: "Fénix Producciones" },
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

export const entrada = (numero, cambios = {}) => ({
  numero,
  fechaUso: null,
  puedeValidarse: false,
  ...cambios,
});

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
    entradas: [entrada(1), entrada(2)],
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

export function mensaje(cambios = {}) {
  return {
    id: 1,
    usuario: { id: 3, nombre: "Ana Pérez", rol: "COMPRADOR" },
    mensaje: "¿A qué hora abren las puertas?",
    enviado: "2026-11-01T15:00:00.000Z",
    ...cambios,
  };
}

export function conversacionResumen(cambios = {}) {
  return {
    compraId: 7,
    estado: "CONFIRMADA",
    evento: { id: 1, nombre: "Los Piojos en River", imagen: "/imagenes/piojos.jpg" },
    contraparte: { id: 2, nombre: "Fénix Producciones" },
    ultimoMensaje: mensaje({
      id: 2,
      usuario: { id: 2, nombre: "Fénix Producciones", rol: "ORGANIZADOR" },
      mensaje: "Abrimos a las 17 h. ¡Los esperamos!",
    }),
    noLeidos: 1,
    ...cambios,
  };
}

export const paginaDeConversaciones = (conversaciones, extra = {}) => ({
  conversaciones,
  total: conversaciones.length,
  page: 1,
  totalPages: conversaciones.length ? 1 : 0,
  totalNoLeidos: conversaciones.reduce((suma, c) => suma + c.noLeidos, 0),
  ...extra,
});

export const paginaDeMensajes = (mensajes, hayMas = false) => ({ mensajes, hayMas });

export function conversacion() {
  return {
    pregunta: mensaje({ id: 1 }),
    respuesta: mensaje({
      id: 2,
      usuario: { id: 2, nombre: "Fénix Producciones", rol: "ORGANIZADOR" },
      mensaje: "Abrimos a las 17 h. ¡Los esperamos!",
      enviado: "2026-11-01T15:05:00.000Z",
    }),
    nuevo: mensaje({ id: 3, mensaje: "¿Hay guardarropas?", enviado: "2026-11-02T10:00:00.000Z" }),
  };
}

export function paginaDeCategorias(categorias, { page = 1, totalPages = 1, total } = {}) {
  return { categorias, total: total ?? categorias.length, page, totalPages };
}

export function dosPaginasDeCategorias(primera, segunda) {
  const total = primera.length + segunda.length;
  return [
    paginaDeCategorias(primera, { totalPages: 2, total }),
    paginaDeCategorias(segunda, { page: 2, totalPages: 2, total }),
  ];
}

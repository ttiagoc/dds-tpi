const creados = [];
const RESERVADOS = ["connect", "disconnect", "connect_error"];

function crearSocket(url, opciones) {
  let oyentes = {};
  let generales = [];
  const socket = {
    url,
    opciones,
    respuestaAlUnirse: { ok: true },
    emit: jest.fn((evento, datos, ack) => {
      if (evento === "compra:unirse") ack?.(socket.respuestaAlUnirse);
    }),
    on: jest.fn((evento, oyente) => {
      oyentes[evento] = [...(oyentes[evento] ?? []), oyente];
      return socket;
    }),
    onAny: jest.fn((oyente) => {
      generales = [...generales, oyente];
      return socket;
    }),
    off: jest.fn(() => {
      oyentes = {};
      return socket;
    }),
    offAny: jest.fn(() => {
      generales = [];
      return socket;
    }),
    disconnect: jest.fn(),
    simular: (evento, ...datos) => {
      (oyentes[evento] ?? []).forEach((oyente) => oyente(...datos));
      if (!RESERVADOS.includes(evento)) generales.forEach((oyente) => oyente(evento, ...datos));
    },
    oyentesDe: (evento) => (oyentes[evento] ?? []).length,
    oyentesGenerales: () => generales.length,
  };
  creados.push(socket);
  return socket;
}

export const io = jest.fn(crearSocket);
export const ultimoSocket = () => creados.at(-1);

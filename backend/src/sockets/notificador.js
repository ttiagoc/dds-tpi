export const salaDeCompra = (compraId) => `compra:${compraId}`;
export const salaDeUsuario = (usuarioId) => `usuario:${usuarioId}`;

export const notificadorNulo = Object.freeze({
  mensajeNuevo() {},
  estadoCompra() {},
  conversacionActualizada() {},
});

function emitirSinRomper(io, sala, evento, payload) {
  try {
    io.to(sala).emit(evento, payload);
  } catch (error) {
    console.error(`No se pudo emitir ${evento} a ${sala}:`, error);
  }
}

export function crearNotificadorSocket(io) {
  return {
    mensajeNuevo: (compraId, mensaje) =>
      emitirSinRomper(io, salaDeCompra(compraId), "mensaje:nuevo", mensaje),
    estadoCompra: (compraId, estado) =>
      emitirSinRomper(io, salaDeCompra(compraId), "compra:estado", { compraId, estado }),
    conversacionActualizada: (usuarioId, conversacion) =>
      emitirSinRomper(io, salaDeUsuario(usuarioId), "conversacion:actualizada", conversacion),
  };
}

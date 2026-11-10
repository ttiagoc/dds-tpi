export const salaDeCompra = (compraId) => `compra:${compraId}`;

export const notificadorNulo = Object.freeze({
  mensajeNuevo() {},
  estadoCompra() {},
});

function emitirSinRomper(io, compraId, evento, payload) {
  try {
    io.to(salaDeCompra(compraId)).emit(evento, payload);
  } catch (error) {
    console.error(`No se pudo emitir ${evento} a la compra ${compraId}:`, error);
  }
}

export function crearNotificadorSocket(io) {
  return {
    mensajeNuevo: (compraId, mensaje) => emitirSinRomper(io, compraId, "mensaje:nuevo", mensaje),
    estadoCompra: (compraId, estado) =>
      emitirSinRomper(io, compraId, "compra:estado", { compraId, estado }),
  };
}

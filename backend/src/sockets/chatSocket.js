import { AppError } from "../errors/AppError.js";
import { MENSAJE_ERROR_CHAT, MENSAJE_NO_AUTENTICADO } from "../errors/mensajes.js";
import { parsearId } from "../validations/parsearId.js";
import { salaDeCompra, salaDeUsuario } from "./notificador.js";

function autenticarHandshake(authService) {
  return async (socket, next) => {
    try {
      const usuario = await authService.usuarioDesdeToken(socket.handshake.auth?.token);
      socket.data.usuario = { id: usuario.id, rol: usuario.rol };
      next();
    } catch {
      next(new Error(MENSAJE_NO_AUTENTICADO));
    }
  };
}

function mensajeDeError(error) {
  if (error instanceof AppError) return error.message;
  console.error("Error inesperado en compra:unirse:", error);
  return MENSAJE_ERROR_CHAT;
}

function unirseALaCompra(socket, mensajeService) {
  return async (payload, ack) => {
    const responder = typeof ack === "function" ? ack : () => {};
    try {
      const compraId = parsearId(payload?.compraId);
      await mensajeService.verificarParticipante(compraId, socket.data.usuario);
      await socket.join(salaDeCompra(compraId));
      responder({ ok: true });
    } catch (error) {
      responder({ ok: false, error: mensajeDeError(error) });
    }
  };
}

function salirDeLaCompra(socket) {
  return (payload) => {
    try {
      socket.leave(salaDeCompra(parsearId(payload?.compraId)));
    } catch {
      return;
    }
  };
}

export function registrarChat(io, { authService, mensajeService }) {
  io.use(autenticarHandshake(authService));
  io.on("connection", (socket) => {
    socket.join(salaDeUsuario(socket.data.usuario.id));
    socket.on("compra:unirse", unirseALaCompra(socket, mensajeService));
    socket.on("compra:salir", salirDeLaCompra(socket));
  });
}

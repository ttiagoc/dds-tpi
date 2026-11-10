import { ForbiddenError, NotFoundError } from "../errors/AppError.js";
import { MENSAJE_COMPRA_INEXISTENTE, MENSAJE_SIN_PERMISO } from "../errors/mensajes.js";

export async function buscarCompra(compraRepository, id) {
  const compra = await compraRepository.findById(id);
  if (!compra) throw new NotFoundError(MENSAJE_COMPRA_INEXISTENTE);
  return compra;
}

export async function buscarCompraDelParticipante(compraRepository, id, usuarioId) {
  const compra = await buscarCompra(compraRepository, id);
  exigirPermiso(compra.participa(usuarioId));
  return compra;
}

export function exigirPermiso(permitido) {
  if (!permitido) throw new ForbiddenError(MENSAJE_SIN_PERMISO);
}

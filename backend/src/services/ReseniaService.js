import { ConflictError, NotFoundError } from "../errors/AppError.js";
import { Resenia } from "../domain/Resenia.js";
import { relojSistema } from "../config/reloj.js";
import { MENSAJE_COMPRA_RESENIADA, MENSAJE_ORGANIZADOR_INEXISTENTE } from "../errors/mensajes.js";
import { paginar } from "./paginacion.js";
import { buscarCompra, exigirPermiso } from "./compras.js";

const masNuevaPrimero = (a, b) => b.fecha - a.fecha || b.id - a.id;

export class ReseniaService {
  constructor({ compraRepository, reseniaRepository, usuarioRepository, reloj = relojSistema }) {
    this.compraRepository = compraRepository;
    this.reseniaRepository = reseniaRepository;
    this.usuarioRepository = usuarioRepository;
    this.reloj = reloj;
  }

  async crear(compraId, { puntuacion, detalle }, usuario) {
    const compra = await buscarCompra(this.compraRepository, compraId);
    exigirPermiso(compra.esDe(usuario.id));
    if (await this.reseniaRepository.findByCompraId(compra.id)) {
      throw new ConflictError(MENSAJE_COMPRA_RESENIADA);
    }
    const resenia = Resenia.crear({ compra, puntuacion, detalle }, this.reloj.ahora());
    await this.reseniaRepository.save(resenia);
    return this.toResponse(resenia);
  }

  async listarDelOrganizador(organizadorId, paginacion) {
    const organizador = await this.usuarioRepository.findById(organizadorId);
    if (!organizador?.esOrganizador()) throw new NotFoundError(MENSAJE_ORGANIZADOR_INEXISTENTE);
    const todas = await this.reseniaRepository.findByOrganizador(organizador.id);
    const { items, ...pagina } = paginar([...todas].sort(masNuevaPrimero), paginacion);
    return {
      organizador: {
        id: organizador.id,
        nombre: organizador.nombreCompleto(),
        puntajePromedio: Resenia.promedio(todas),
        cantidadResenias: todas.length,
      },
      resenias: items.map((resenia) => this.toResponse(resenia)),
      ...pagina,
    };
  }

  toResponse({ id, compraId, puntuacion, detalle, fecha, evento, comprador }) {
    return {
      id,
      compraId,
      puntuacion,
      detalle,
      fecha: fecha.toISOString(),
      evento: { id: evento.id, nombre: evento.nombre },
      comprador: { nombre: comprador.nombreCompleto() },
    };
  }
}

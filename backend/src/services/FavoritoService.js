import { NotFoundError } from "../errors/AppError.js";
import { MENSAJE_EVENTO_INEXISTENTE } from "../errors/mensajes.js";
import { Evento } from "../domain/Evento.js";
import { paginar } from "./paginacion.js";

export class FavoritoService {
  constructor({ usuarioRepository, eventoRepository, eventoService }) {
    this.usuarioRepository = usuarioRepository;
    this.eventoRepository = eventoRepository;
    this.eventoService = eventoService;
  }

  async listar(usuario, paginacion) {
    const comprador = await this.usuarioRepository.findById(usuario.id);
    const eventos = await Promise.all(
      comprador.favoritos.map((id) => this.eventoRepository.findById(id)),
    );
    const { items, ...pagina } = paginar(eventos.sort(Evento.compararPorFecha), paginacion);
    return { eventos: await this.eventoService.resumenes(items, usuario), ...pagina };
  }

  async agregar(eventoId, usuario) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundError(MENSAJE_EVENTO_INEXISTENTE);
    await this.modificar(usuario, (comprador) => comprador.agregarFavorito(evento.id));
  }

  async quitar(eventoId, usuario) {
    await this.modificar(usuario, (comprador) => comprador.quitarFavorito(eventoId));
  }

  async modificar(usuario, cambio) {
    const comprador = await this.usuarioRepository.findById(usuario.id);
    cambio(comprador);
    await this.usuarioRepository.save(comprador);
  }
}

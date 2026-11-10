import { InMemoryRepository } from "./InMemoryRepository.js";

export class ReseniaRepository extends InMemoryRepository {
  async findByCompraId(compraId) {
    return this.findOneWhere((resenia) => resenia.compraId === Number(compraId));
  }

  async findByEvento(eventoId) {
    return this.findWhere((resenia) => resenia.evento.id === Number(eventoId));
  }

  async findByOrganizador(organizadorId) {
    return this.findWhere((resenia) => resenia.evento.esDe(Number(organizadorId)));
  }
}

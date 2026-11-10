import { InMemoryRepository } from "./InMemoryRepository.js";

export class CompraRepository extends InMemoryRepository {
  async findByComprador(compradorId) {
    return this.findWhere((compra) => compra.esDe(Number(compradorId)));
  }

  async findByEvento(eventoId) {
    return this.findWhere((compra) => compra.evento.id === Number(eventoId));
  }
}

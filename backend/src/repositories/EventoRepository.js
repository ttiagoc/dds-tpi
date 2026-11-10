import { InMemoryRepository } from "./InMemoryRepository.js";

export class EventoRepository extends InMemoryRepository {
  async findByOrganizador(organizadorId) {
    return this.findWhere((evento) => evento.esDe(Number(organizadorId)));
  }
}

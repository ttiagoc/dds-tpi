import { InMemoryRepository } from "./InMemoryRepository.js";

function cumpleFiltros(evento, { q, categoria, precioMin, precioMax, incluirPasados }, ahora) {
  return (
    (incluirPasados || !evento.yaOcurrio(ahora)) &&
    (categoria == null || evento.categoria.id === categoria) &&
    (q == null || evento.coincideCon(q)) &&
    evento.tuPrecioEstaEntre(precioMin, precioMax)
  );
}

export class EventoRepository extends InMemoryRepository {
  async findByOrganizador(organizadorId) {
    return this.findWhere((evento) => evento.esDe(Number(organizadorId)));
  }

  async buscar(filtros, ahora) {
    return this.findWhere((evento) => cumpleFiltros(evento, filtros, ahora));
  }
}

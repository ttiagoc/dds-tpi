import { InMemoryRepository } from "./InMemoryRepository.js";

export class UsuarioRepository extends InMemoryRepository {
  async findByEmail(email) {
    const buscado = String(email ?? "").toLowerCase();
    return this.findOneWhere((usuario) => usuario.email === buscado);
  }
}

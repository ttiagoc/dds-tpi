import { Categoria } from "../domain/Categoria.js";
import { InMemoryRepository } from "./InMemoryRepository.js";

export class CategoriaRepository extends InMemoryRepository {
  async buscar(texto) {
    const categorias = await this.findAll();
    return categorias.filter((c) => c.coincideCon(texto)).sort(Categoria.compararPorNombre);
  }
}

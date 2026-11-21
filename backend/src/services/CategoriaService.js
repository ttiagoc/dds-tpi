import { paginar } from "./paginacion.js";

export class CategoriaService {
  constructor({ categoriaRepository }) {
    this.categoriaRepository = categoriaRepository;
  }

  async listar({ q, page, limit }) {
    const categorias = await this.categoriaRepository.buscar(q);
    const { items, ...pagina } = paginar(categorias, { page, limit });
    return { categorias: items.map((c) => this.toResponse(c)), ...pagina };
  }

  toResponse({ id, nombre, descripcion }) {
    return { id, nombre, descripcion };
  }
}

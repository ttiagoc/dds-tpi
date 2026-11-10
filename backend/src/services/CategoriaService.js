export class CategoriaService {
  constructor({ categoriaRepository }) {
    this.categoriaRepository = categoriaRepository;
  }

  async listar() {
    const categorias = await this.categoriaRepository.findAll();
    return categorias.sort((a, b) => a.id - b.id).map((c) => this.toResponse(c));
  }

  toResponse({ id, nombre, descripcion }) {
    return { id, nombre, descripcion };
  }
}

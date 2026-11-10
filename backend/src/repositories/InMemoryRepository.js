export class InMemoryRepository {
  constructor() {
    this.items = new Map();
    this.nextId = 1;
  }

  async findAll() {
    return [...this.items.values()];
  }

  async findById(id) {
    return this.items.get(Number(id)) ?? null;
  }

  async findWhere(predicado) {
    return [...this.items.values()].filter(predicado);
  }

  async findOneWhere(predicado) {
    return [...this.items.values()].find(predicado) ?? null;
  }

  async save(entidad) {
    if (entidad.id == null) entidad.id = this.nextId;
    this.nextId = Math.max(this.nextId, entidad.id + 1);
    this.items.set(entidad.id, entidad);
    return entidad;
  }

  async delete(id) {
    return this.items.delete(Number(id));
  }

  async clear() {
    this.items.clear();
    this.nextId = 1;
  }
}

export function paginar(lista, { page, limit }) {
  return {
    items: lista.slice((page - 1) * limit, page * limit),
    total: lista.length,
    page,
    totalPages: Math.ceil(lista.length / limit),
  };
}

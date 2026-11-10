import { describe, it, expect } from "@jest/globals";
import { paginar } from "../../src/services/paginacion.js";

describe("paginar", () => {
  const lista = [1, 2, 3, 4, 5];

  it("devuelve la página pedida con total y totalPages", () => {
    expect(paginar(lista, { page: 2, limit: 2 })).toEqual({
      items: [3, 4],
      total: 5,
      page: 2,
      totalPages: 3,
    });
  });

  it("una página más allá de la última viene vacía", () => {
    expect(paginar(lista, { page: 4, limit: 2 }).items).toEqual([]);
  });

  it("una lista vacía da totalPages 0", () => {
    expect(paginar([], { page: 1, limit: 20 })).toEqual({
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });
  });
});

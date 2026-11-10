import { describe, it, expect, jest } from "@jest/globals";
import { CategoriaService } from "../../src/services/CategoriaService.js";
import { crearCategoria } from "../helpers/domainFactories.js";

describe("CategoriaService", () => {
  it("lista las categorías ordenadas por id", async () => {
    const categoriaRepository = {
      findAll: jest.fn(async () => [
        crearCategoria({ id: 3, nombre: "Festivales", descripcion: "Varios" }),
        crearCategoria(),
      ]),
    };
    expect(await new CategoriaService({ categoriaRepository }).listar()).toEqual([
      { id: 1, nombre: "Recitales", descripcion: "Música en vivo" },
      { id: 3, nombre: "Festivales", descripcion: "Varios" },
    ]);
  });
});

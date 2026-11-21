import { describe, it, expect, beforeEach } from "@jest/globals";
import { CategoriaService } from "../../src/services/CategoriaService.js";
import { CategoriaRepository } from "../../src/repositories/CategoriaRepository.js";
import { crearCategoria } from "../helpers/domainFactories.js";

const NOMBRES = ["Teatro", "Conferencias", "Ánimo", "Cine", "Conciertos"];

let service;

beforeEach(async () => {
  const categoriaRepository = new CategoriaRepository();
  for (const nombre of NOMBRES)
    await categoriaRepository.save(crearCategoria({ id: null, nombre }));
  service = new CategoriaService({ categoriaRepository });
});

const nombres = (respuesta) => respuesta.categorias.map((c) => c.nombre);

describe("CategoriaService.listar", () => {
  it("ordena por nombre sin que los acentos cambien el orden", async () => {
    const respuesta = await service.listar({ page: 1, limit: 20 });
    expect(nombres(respuesta)).toEqual(["Ánimo", "Cine", "Conciertos", "Conferencias", "Teatro"]);
    expect(respuesta).toMatchObject({ total: 5, page: 1, totalPages: 1 });
  });

  it("filtra por texto", async () => {
    expect(nombres(await service.listar({ q: "con", page: 1, limit: 20 }))).toEqual([
      "Conciertos",
      "Conferencias",
    ]);
  });

  it("pagina", async () => {
    const segunda = await service.listar({ page: 2, limit: 2 });
    expect(nombres(segunda)).toEqual(["Conciertos", "Conferencias"]);
    expect(segunda).toMatchObject({ total: 5, page: 2, totalPages: 3 });
  });

  it("una página fuera de rango viene vacía", async () => {
    expect(await service.listar({ page: 9, limit: 2 })).toMatchObject({ categorias: [], total: 5 });
  });

  it("devuelve id, nombre y descripción", async () => {
    const [primera] = (await service.listar({ q: "cine", page: 1, limit: 20 })).categorias;
    expect(primera).toEqual({ id: 4, nombre: "Cine", descripcion: "Música en vivo" });
  });
});

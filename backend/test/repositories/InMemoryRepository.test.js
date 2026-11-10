import { describe, it, expect, beforeEach } from "@jest/globals";
import { InMemoryRepository } from "../../src/repositories/InMemoryRepository.js";

describe("InMemoryRepository", () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryRepository();
  });

  it("asigna ids incrementales al guardar entidades sin id", async () => {
    const primera = await repo.save({ id: null, nombre: "a" });
    const segunda = await repo.save({ id: null, nombre: "b" });
    expect([primera.id, segunda.id]).toEqual([1, 2]);
  });

  it("busca por id aunque llegue como string", async () => {
    const guardada = await repo.save({ id: null });
    expect(await repo.findById("1")).toBe(guardada);
  });

  it("devuelve null si el id no existe", async () => {
    expect(await repo.findById(99)).toBeNull();
  });

  it("findAll devuelve una copia del arreglo con las mismas instancias", async () => {
    const guardada = await repo.save({ id: null });
    const todas = await repo.findAll();
    todas.pop();
    expect(await repo.findAll()).toEqual([guardada]);
    expect((await repo.findAll())[0]).toBe(guardada);
  });

  it("reemplaza la entidad si ya tiene id", async () => {
    const guardada = await repo.save({ id: null, nombre: "a" });
    await repo.save({ id: guardada.id, nombre: "b" });
    expect(await repo.findAll()).toEqual([{ id: 1, nombre: "b" }]);
  });

  it("un id explícito mayor corre el contador", async () => {
    await repo.save({ id: 10 });
    expect((await repo.save({ id: null })).id).toBe(11);
  });

  it("delete informa si borró algo", async () => {
    await repo.save({ id: null });
    expect(await repo.delete("1")).toBe(true);
    expect(await repo.delete(1)).toBe(false);
    expect(await repo.findById(1)).toBeNull();
  });

  it("clear vacía y reinicia el contador", async () => {
    await repo.save({ id: null });
    await repo.clear();
    expect(await repo.findAll()).toEqual([]);
    expect((await repo.save({ id: null })).id).toBe(1);
  });

  it("findWhere y findOneWhere filtran por predicado", async () => {
    await repo.save({ id: null, par: false });
    const par = await repo.save({ id: null, par: true });
    expect(await repo.findWhere((e) => e.par)).toEqual([par]);
    expect(await repo.findOneWhere((e) => e.par)).toBe(par);
    expect(await repo.findOneWhere((e) => e.id === 9)).toBeNull();
  });
});

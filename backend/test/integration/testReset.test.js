import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { crearAppDePrueba } from "../helpers/appDePrueba.js";

describe("POST /test/reset", () => {
  it("en test responde 204 y restaura el seed con ids desde 1", async () => {
    const { app, contenedor } = await crearAppDePrueba();
    const { compraRepository } = contenedor.repos;
    const cantidadOriginal = (await compraRepository.findAll()).length;
    await compraRepository.delete(1);

    const res = await request(app).post("/test/reset");

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(await compraRepository.findById(1)).not.toBeNull();
    expect(await compraRepository.findAll()).toHaveLength(cantidadOriginal);
  });

  it("fuera de test no existe", async () => {
    const { app } = await crearAppDePrueba({ nodeEnv: "development" });
    const res = await request(app).post("/test/reset");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No existe la ruta POST /test/reset");
  });
});

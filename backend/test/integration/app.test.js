import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import express from "express";
import { crearApp } from "../../src/app.js";
import { crearContenedor } from "../../src/contenedor.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import { UnprocessableEntityError } from "../../src/errors/AppError.js";

const app = crearApp(crearContenedor());

describe("app base", () => {
  it("GET /healthcheck responde ok", async () => {
    const res = await request(app).get("/healthcheck");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("responde 404 con el formato de error ante una ruta inexistente", async () => {
    const res = await request(app).get("/nada");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: "fail",
      message: "No existe la ruta GET /nada",
      timestamp: expect.any(String),
    });
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it("responde 400 ante JSON mal formado", async () => {
    const res = await request(app)
      .post("/nada")
      .set("Content-Type", "application/json")
      .send("{malo");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("El cuerpo de la solicitud no es un JSON válido");
  });

  it("habilita CORS para cualquier origen", async () => {
    const res = await request(app).get("/healthcheck").set("Origin", "http://localhost:8081");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });
});

describe("errorHandler montado en express", () => {
  const prueba = express();
  prueba.get("/negocio", () => {
    throw new UnprocessableEntityError("No hay cupo suficiente para VIP");
  });
  prueba.get("/async", async () => {
    throw new Error("boom");
  });
  prueba.use(errorHandler);

  it("responde 422 ante un error de negocio", async () => {
    const res = await request(prueba).get("/negocio");
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ status: "fail", message: "No hay cupo suficiente para VIP" });
  });

  it("responde 500 sin stack ante un error inesperado en un handler async", async () => {
    const res = await request(prueba).get("/async");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      status: "error",
      message: "Error interno del servidor",
      timestamp: expect.any(String),
    });
  });
});

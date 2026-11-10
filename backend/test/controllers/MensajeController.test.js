import { describe, it, expect, jest } from "@jest/globals";
import { MensajeController } from "../../src/controllers/MensajeController.js";
import { llamarController, probarIdYErrores, usuarioComprador } from "../helpers/http.js";

describe("MensajeController", () => {
  it("listar parsea el id, delega el usuario y responde 200", async () => {
    const mensajes = [{ id: 1 }];
    const servicio = { listar: jest.fn().mockResolvedValue(mensajes) };
    const req = { params: { id: "7" } };
    const { res } = await llamarController(MensajeController, "listar", req, servicio);
    expect(servicio.listar).toHaveBeenCalledWith(7, usuarioComprador);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mensajes);
  });

  it("enviar parsea el id, delega el body y el usuario y responde 201", async () => {
    const mensaje = { id: 3 };
    const body = { mensaje: "Hola" };
    const servicio = { enviar: jest.fn().mockResolvedValue(mensaje) };
    const req = { params: { id: "7" }, body };
    const { res } = await llamarController(MensajeController, "enviar", req, servicio);
    expect(servicio.enviar).toHaveBeenCalledWith(7, body, usuarioComprador);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mensaje);
  });
});

probarIdYErrores(MensajeController, [
  ["listar", "id"],
  ["enviar", "id"],
]);

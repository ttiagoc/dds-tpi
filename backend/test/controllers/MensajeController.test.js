import { describe, it, expect, jest } from "@jest/globals";
import { MensajeController } from "../../src/controllers/MensajeController.js";
import {
  llamarController,
  probarIdYErrores,
  probarQueryInvalida,
  responderCon,
  usuarioComprador,
} from "../helpers/http.js";

describe("MensajeController", () => {
  it("listar parsea el id y el cursor, delega el usuario y responde 200", async () => {
    const req = { params: { id: "7" }, query: { antesDe: "5" } };
    const pagina = { mensajes: [{ id: 1 }], hayMas: false };
    const listar = await responderCon(MensajeController, "listar", req, pagina);
    expect(listar).toHaveBeenCalledWith(7, usuarioComprador, { antesDe: 5, limit: 30 });
  });

  probarQueryInvalida(MensajeController, "listar", {
    params: { id: "7" },
    query: { antesDe: "abc" },
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

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

describe("MensajeController: bandeja", () => {
  it("listarConversaciones valida la paginación, delega el usuario y responde 200", async () => {
    const pagina = { conversaciones: [], total: 0, page: 1, totalPages: 0, totalNoLeidos: 0 };
    const req = { query: { limit: "5" } };
    const listar = await responderCon(MensajeController, "listarConversaciones", req, pagina);
    expect(listar).toHaveBeenCalledWith(usuarioComprador, { page: 1, limit: 5 });
  });

  probarQueryInvalida(MensajeController, "listarConversaciones", { query: { limit: "0" } });

  it("marcarLeidos parsea el id, delega y responde 204 sin cuerpo", async () => {
    const servicio = { marcarLeidos: jest.fn().mockResolvedValue(undefined) };
    const req = { params: { id: "7" } };
    const { res } = await llamarController(MensajeController, "marcarLeidos", req, servicio);
    expect(servicio.marcarLeidos).toHaveBeenCalledWith(7, usuarioComprador);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith();
  });
});

probarIdYErrores(MensajeController, [
  ["marcarLeidos", "id"],
  ["listar", "id"],
  ["enviar", "id"],
]);

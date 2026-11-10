import { describe, it, expect, jest } from "@jest/globals";
import { ReseniaController } from "../../src/controllers/ReseniaController.js";
import { BadRequestError } from "../../src/errors/AppError.js";
import { llamarController, probarIdYErrores, usuarioComprador } from "../helpers/http.js";

describe("ReseniaController", () => {
  it("crear parsea el id, delega el body y el usuario y responde 201", async () => {
    const resenia = { id: 50 };
    const body = { puntuacion: 5, detalle: "Genial" };
    const servicio = { crear: jest.fn().mockResolvedValue(resenia) };
    const req = { params: { id: "7" }, body };
    const { res } = await llamarController(ReseniaController, "crear", req, servicio);
    expect(servicio.crear).toHaveBeenCalledWith(7, body, usuarioComprador);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(resenia);
  });

  it("listarDelOrganizador parsea el id, valida la query y responde 200", async () => {
    const pagina = { organizador: { id: 2 }, resenias: [], total: 0, page: 1, totalPages: 0 };
    const servicio = { listarDelOrganizador: jest.fn().mockResolvedValue(pagina) };
    const req = { params: { id: "2" }, query: { limit: "5" } };
    const { res } = await llamarController(
      ReseniaController,
      "listarDelOrganizador",
      req,
      servicio,
    );
    expect(servicio.listarDelOrganizador).toHaveBeenCalledWith(2, { page: 1, limit: 5 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(pagina);
  });

  it("listarDelOrganizador manda a next un 400 con una query inválida", async () => {
    const servicio = { listarDelOrganizador: jest.fn() };
    const req = { params: { id: "2" }, query: { orden: "desc" } };
    const { next } = await llamarController(
      ReseniaController,
      "listarDelOrganizador",
      req,
      servicio,
    );
    expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
    expect(servicio.listarDelOrganizador).not.toHaveBeenCalled();
  });
});

probarIdYErrores(ReseniaController, [
  ["crear", "id"],
  ["listarDelOrganizador", "id"],
]);

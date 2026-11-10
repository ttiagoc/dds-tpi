import { describe, it, expect, jest } from "@jest/globals";
import { CompraController } from "../../src/controllers/CompraController.js";
import { BadRequestError, ForbiddenError } from "../../src/errors/AppError.js";
import { crearRes } from "../helpers/http.js";

const usuario = { id: 3, rol: "COMPRADOR" };
const detalle = { id: 7 };

async function llamar(metodo, req, servicio = { [metodo]: jest.fn().mockResolvedValue(detalle) }) {
  const res = crearRes();
  const next = jest.fn();
  await new CompraController(servicio)[metodo]({ usuario, ...req }, res, next);
  return { res, next, servicio };
}

describe("CompraController", () => {
  it("crear delega el body y el usuario y responde 201", async () => {
    const body = { eventoId: 1, tipoEntradaId: 1, cantidad: 2 };
    const { res, servicio } = await llamar("crear", { body });
    expect(servicio.crear).toHaveBeenCalledWith(body, usuario);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(detalle);
  });

  it("listarDelComprador valida la query, delega y responde 200", async () => {
    const pagina = { compras: [], total: 0, page: 1, totalPages: 0 };
    const servicio = { listarDelComprador: jest.fn().mockResolvedValue(pagina) };
    const { res } = await llamar(
      "listarDelComprador",
      { query: { estado: "PENDIENTE" } },
      servicio,
    );
    expect(servicio.listarDelComprador).toHaveBeenCalledWith(usuario, {
      estado: "PENDIENTE",
      page: 1,
      limit: 20,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(pagina);
  });

  it("listarDelComprador manda a next un 400 si la query es inválida", async () => {
    const servicio = { listarDelComprador: jest.fn() };
    const { next } = await llamar("listarDelComprador", { query: { estado: "PAGADA" } }, servicio);
    expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
    expect(servicio.listarDelComprador).not.toHaveBeenCalled();
  });

  it.each(["obtener", "pagar", "cancelar", "marcarUtilizada"])(
    "%s parsea el id, delega con el usuario y responde 200",
    async (metodo) => {
      const { res, servicio } = await llamar(metodo, { params: { id: "7" } });
      expect(servicio[metodo]).toHaveBeenCalledWith(7, usuario);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(detalle);
    },
  );

  it.each(["obtener", "pagar", "cancelar", "marcarUtilizada", "listarDelEvento"])(
    "%s manda a next un 400 con un id inválido",
    async (metodo) => {
      const servicio = { [metodo]: jest.fn() };
      const { next } = await llamar(metodo, { params: { id: "abc" } }, servicio);
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(servicio[metodo]).not.toHaveBeenCalled();
    },
  );

  it.each(["crear", "obtener", "pagar", "cancelar", "marcarUtilizada", "listarDelEvento"])(
    "%s pasa el error del service a next",
    async (metodo) => {
      const error = new ForbiddenError("No tenés permiso para realizar esta acción");
      const servicio = { [metodo]: jest.fn().mockRejectedValue(error) };
      const { next } = await llamar(metodo, { params: { id: "7" }, body: {} }, servicio);
      expect(next).toHaveBeenCalledWith(error);
    },
  );

  it("listarDelEvento parsea el id, valida la query, delega con el usuario y responde 200", async () => {
    const pagina = { evento: { id: 4 }, disponibilidad: [], compras: [], total: 0 };
    const servicio = { listarDelEvento: jest.fn().mockResolvedValue(pagina) };
    const { res } = await llamar(
      "listarDelEvento",
      { params: { id: "4" }, query: { estado: "CONFIRMADA", page: "2" } },
      servicio,
    );
    expect(servicio.listarDelEvento).toHaveBeenCalledWith(4, usuario, {
      estado: "CONFIRMADA",
      page: 2,
      limit: 20,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(pagina);
  });

  it("listarDelEvento manda a next un 400 si la query es inválida", async () => {
    const servicio = { listarDelEvento: jest.fn() };
    const { next } = await llamar(
      "listarDelEvento",
      { params: { id: "4" }, query: { limit: "51" } },
      servicio,
    );
    expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
    expect(servicio.listarDelEvento).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, jest } from "@jest/globals";
import { EventoController } from "../../src/controllers/EventoController.js";
import { CategoriaController } from "../../src/controllers/CategoriaController.js";
import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../src/errors/AppError.js";
import { crearRes } from "../helpers/http.js";

const usuario = { id: 3, rol: "COMPRADOR" };

describe("EventoController", () => {
  it("buscar valida la query, delega con el usuario y responde 200", async () => {
    const pagina = { eventos: [], total: 0, page: 1, totalPages: 0 };
    const eventoService = { buscar: jest.fn().mockResolvedValue(pagina) };
    const res = crearRes();
    await new EventoController(eventoService).buscar(
      { query: { q: "rock", limit: "5" }, usuario },
      res,
      jest.fn(),
    );
    expect(eventoService.buscar).toHaveBeenCalledWith(
      expect.objectContaining({ q: "rock", limit: 5, page: 1, ordenarPor: "fecha" }),
      usuario,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(pagina);
  });

  it("buscar manda a next un 400 si la query es inválida", async () => {
    const eventoService = { buscar: jest.fn() };
    const next = jest.fn();
    await new EventoController(eventoService).buscar({ query: { limit: "51" } }, crearRes(), next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
    expect(next.mock.calls[0][0].message).toBe("Parámetros de consulta inválidos");
    expect(eventoService.buscar).not.toHaveBeenCalled();
  });

  it("obtener parsea el id, delega con el usuario y responde 200", async () => {
    const detalle = { id: 4 };
    const eventoService = { obtener: jest.fn().mockResolvedValue(detalle) };
    const res = crearRes();
    await new EventoController(eventoService).obtener(
      { params: { id: "4" }, usuario },
      res,
      jest.fn(),
    );
    expect(eventoService.obtener).toHaveBeenCalledWith(4, usuario);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(detalle);
  });

  it("obtener manda a next un 400 si el id no es un entero positivo", async () => {
    const next = jest.fn();
    await new EventoController({ obtener: jest.fn() }).obtener(
      { params: { id: "abc" } },
      crearRes(),
      next,
    );
    expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
  });

  it("obtener pasa el error del service a next", async () => {
    const error = new NotFoundError("No existe el evento");
    const next = jest.fn();
    const eventoService = { obtener: jest.fn().mockRejectedValue(error) };
    await new EventoController(eventoService).obtener({ params: { id: "9" } }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

describe("EventoController del organizador", () => {
  const organizador = { id: 2, rol: "ORGANIZADOR" };

  it("crear delega el body y el usuario y responde 201 con el detalle", async () => {
    const detalle = { id: 13 };
    const body = { nombre: "Nuevo" };
    const eventoService = { crear: jest.fn().mockResolvedValue(detalle) };
    const res = crearRes();
    await new EventoController(eventoService).crear({ body, usuario: organizador }, res, jest.fn());
    expect(eventoService.crear).toHaveBeenCalledWith(body, organizador);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(detalle);
  });

  it("crear pasa el error del service a next", async () => {
    const error = new UnprocessableEntityError("La categoría no existe");
    const next = jest.fn();
    const eventoService = { crear: jest.fn().mockRejectedValue(error) };
    await new EventoController(eventoService).crear(
      { body: {}, usuario: organizador },
      crearRes(),
      next,
    );
    expect(next).toHaveBeenCalledWith(error);
  });

  it("listarDelOrganizador valida la query, delega y responde 200", async () => {
    const pagina = { eventos: [], total: 0, page: 2, totalPages: 0 };
    const eventoService = { listarDelOrganizador: jest.fn().mockResolvedValue(pagina) };
    const res = crearRes();
    await new EventoController(eventoService).listarDelOrganizador(
      { query: { page: "2" }, usuario: organizador },
      res,
      jest.fn(),
    );
    expect(eventoService.listarDelOrganizador).toHaveBeenCalledWith(organizador, {
      page: 2,
      limit: 20,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(pagina);
  });

  it("listarDelOrganizador manda a next un 400 si la query es inválida", async () => {
    const eventoService = { listarDelOrganizador: jest.fn() };
    const next = jest.fn();
    await new EventoController(eventoService).listarDelOrganizador(
      { query: { q: "rock" }, usuario: organizador },
      crearRes(),
      next,
    );
    expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
    expect(next.mock.calls[0][0].message).toBe("Parámetros de consulta inválidos");
    expect(eventoService.listarDelOrganizador).not.toHaveBeenCalled();
  });
});

describe("CategoriaController", () => {
  it("listar responde 200 con las categorías", async () => {
    const categorias = [{ id: 1, nombre: "Recitales", descripcion: "" }];
    const categoriaService = { listar: jest.fn().mockResolvedValue(categorias) };
    const res = crearRes();
    await new CategoriaController(categoriaService).listar({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(categorias);
  });

  it("listar pasa el error del service a next", async () => {
    const error = new Error("falla");
    const next = jest.fn();
    const categoriaService = { listar: jest.fn().mockRejectedValue(error) };
    await new CategoriaController(categoriaService).listar({}, crearRes(), next);
    expect(next).toHaveBeenCalledWith(error);
  });
});

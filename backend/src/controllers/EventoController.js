import { BaseController } from "./BaseController.js";
import { eventosQueryValidation } from "../validations/eventosQueryValidation.js";
import { paginacionQueryValidation } from "../validations/paginacionQueryValidation.js";

export class EventoController extends BaseController {
  constructor(eventoService) {
    super();
    this.eventoService = eventoService;
  }

  buscar = async (req, res, next) => {
    try {
      const query = this.extraerYValidarQuery(req.query, eventosQueryValidation);
      const pagina = await this.eventoService.buscar(query, req.usuario);
      return res.status(200).json(pagina);
    } catch (error) {
      return next(error);
    }
  };

  obtener = async (req, res, next) => {
    try {
      const id = this.parsearId(req.params.id);
      const evento = await this.eventoService.obtener(id, req.usuario);
      return res.status(200).json(evento);
    } catch (error) {
      return next(error);
    }
  };

  crear = async (req, res, next) => {
    try {
      const evento = await this.eventoService.crear(req.body, req.usuario);
      return res.status(201).json(evento);
    } catch (error) {
      return next(error);
    }
  };

  listarDelOrganizador = async (req, res, next) => {
    try {
      const paginacion = this.extraerYValidarQuery(req.query, paginacionQueryValidation);
      const pagina = await this.eventoService.listarDelOrganizador(req.usuario, paginacion);
      return res.status(200).json(pagina);
    } catch (error) {
      return next(error);
    }
  };
}

import { BaseController } from "./BaseController.js";
import { mensajesQueryValidation } from "../validations/mensajesQueryValidation.js";
import { paginacionQueryValidation } from "../validations/paginacionQueryValidation.js";

export class MensajeController extends BaseController {
  constructor(mensajeService) {
    super();
    this.mensajeService = mensajeService;
  }

  listar = async (req, res, next) => {
    try {
      const compraId = this.parsearId(req.params.id);
      const cursor = this.extraerYValidarQuery(req.query, mensajesQueryValidation);
      const pagina = await this.mensajeService.listar(compraId, req.usuario, cursor);
      return res.status(200).json(pagina);
    } catch (error) {
      return next(error);
    }
  };

  listarConversaciones = async (req, res, next) => {
    try {
      const paginacion = this.extraerYValidarQuery(req.query, paginacionQueryValidation);
      const pagina = await this.mensajeService.listarConversaciones(req.usuario, paginacion);
      return res.status(200).json(pagina);
    } catch (error) {
      return next(error);
    }
  };

  marcarLeidos = async (req, res, next) => {
    try {
      await this.mensajeService.marcarLeidos(this.parsearId(req.params.id), req.usuario);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };

  enviar = async (req, res, next) => {
    try {
      const compraId = this.parsearId(req.params.id);
      const mensaje = await this.mensajeService.enviar(compraId, req.body, req.usuario);
      return res.status(201).json(mensaje);
    } catch (error) {
      return next(error);
    }
  };
}

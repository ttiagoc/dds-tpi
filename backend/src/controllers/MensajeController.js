import { BaseController } from "./BaseController.js";
import { mensajesQueryValidation } from "../validations/mensajesQueryValidation.js";

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

import { BaseController } from "./BaseController.js";

export class MensajeController extends BaseController {
  constructor(mensajeService) {
    super();
    this.mensajeService = mensajeService;
  }

  listar = async (req, res, next) => {
    try {
      const compraId = this.parsearId(req.params.id);
      const mensajes = await this.mensajeService.listar(compraId, req.usuario);
      return res.status(200).json(mensajes);
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

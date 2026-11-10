import { BaseController } from "./BaseController.js";
import { eventosQueryValidation } from "../validations/eventosQueryValidation.js";

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
}

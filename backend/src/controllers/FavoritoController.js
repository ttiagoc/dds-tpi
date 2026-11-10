import { BaseController } from "./BaseController.js";

export class FavoritoController extends BaseController {
  constructor(favoritoService) {
    super();
    this.favoritoService = favoritoService;
  }

  listar = async (req, res, next) => {
    try {
      return res.status(200).json(await this.favoritoService.listar(req.usuario));
    } catch (error) {
      return next(error);
    }
  };

  agregar = (req, res, next) => this.conEventoId("agregar", req, res, next);

  quitar = (req, res, next) => this.conEventoId("quitar", req, res, next);

  async conEventoId(metodo, req, res, next) {
    try {
      const eventoId = this.parsearId(req.params.eventoId);
      await this.favoritoService[metodo](eventoId, req.usuario);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

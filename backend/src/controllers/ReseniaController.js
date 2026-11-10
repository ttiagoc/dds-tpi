import { BaseController } from "./BaseController.js";
import { paginacionQueryValidation } from "../validations/paginacionQueryValidation.js";

export class ReseniaController extends BaseController {
  constructor(reseniaService) {
    super();
    this.reseniaService = reseniaService;
  }

  crear = async (req, res, next) => {
    try {
      const compraId = this.parsearId(req.params.id);
      const resenia = await this.reseniaService.crear(compraId, req.body, req.usuario);
      return res.status(201).json(resenia);
    } catch (error) {
      return next(error);
    }
  };

  listarDelOrganizador = async (req, res, next) => {
    try {
      const organizadorId = this.parsearId(req.params.id);
      const paginacion = this.extraerYValidarQuery(req.query, paginacionQueryValidation);
      const pagina = await this.reseniaService.listarDelOrganizador(organizadorId, paginacion);
      return res.status(200).json(pagina);
    } catch (error) {
      return next(error);
    }
  };
}

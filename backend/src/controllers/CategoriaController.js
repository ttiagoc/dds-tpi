import { BaseController } from "./BaseController.js";
import { categoriasQueryValidation } from "../validations/categoriasQueryValidation.js";

export class CategoriaController extends BaseController {
  constructor(categoriaService) {
    super();
    this.categoriaService = categoriaService;
  }

  listar = async (req, res, next) => {
    try {
      const query = this.extraerYValidarQuery(req.query, categoriasQueryValidation);
      return res.status(200).json(await this.categoriaService.listar(query));
    } catch (error) {
      return next(error);
    }
  };
}

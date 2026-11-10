import { BaseController } from "./BaseController.js";

export class CategoriaController extends BaseController {
  constructor(categoriaService) {
    super();
    this.categoriaService = categoriaService;
  }

  listar = async (_req, res, next) => {
    try {
      const categorias = await this.categoriaService.listar();
      return res.status(200).json(categorias);
    } catch (error) {
      return next(error);
    }
  };
}

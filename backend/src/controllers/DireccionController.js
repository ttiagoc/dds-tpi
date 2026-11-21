import { BaseController } from "./BaseController.js";
import { ubicacionQueryValidation } from "../validations/ubicacionQueryValidation.js";

export class DireccionController extends BaseController {
  constructor(direccionService) {
    super();
    this.direccionService = direccionService;
  }

  ubicacion = async (req, res, next) => {
    try {
      const campos = this.extraerYValidarQuery(req.query, ubicacionQueryValidation);
      return res.status(200).json(await this.direccionService.ubicar(campos));
    } catch (error) {
      return next(error);
    }
  };
}

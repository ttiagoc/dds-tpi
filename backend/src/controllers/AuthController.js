import { BaseController } from "./BaseController.js";

export class AuthController extends BaseController {
  constructor(authService) {
    super();
    this.authService = authService;
  }

  login = async (req, res, next) => {
    try {
      const resultado = await this.authService.login(req.body);
      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  };

  yo = async (req, res, next) => {
    try {
      const usuario = await this.authService.perfil(req.usuario.id);
      return res.status(200).json(usuario);
    } catch (error) {
      return next(error);
    }
  };
}

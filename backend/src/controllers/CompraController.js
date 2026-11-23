import { BaseController } from "./BaseController.js";
import { comprasQueryValidation } from "../validations/comprasQueryValidation.js";

export class CompraController extends BaseController {
  constructor(compraService) {
    super();
    this.compraService = compraService;
  }

  crear = async (req, res, next) => {
    try {
      const compra = await this.compraService.crear(req.body, req.usuario);
      return res.status(201).json(compra);
    } catch (error) {
      return next(error);
    }
  };

  listarDelComprador = async (req, res, next) => {
    try {
      const query = this.extraerYValidarQuery(req.query, comprasQueryValidation);
      const pagina = await this.compraService.listarDelComprador(req.usuario, query);
      return res.status(200).json(pagina);
    } catch (error) {
      return next(error);
    }
  };

  obtener = (req, res, next) => this.conId("obtener", req, res, next);

  pagar = (req, res, next) => this.conId("pagar", req, res, next);

  cancelar = (req, res, next) => this.conId("cancelar", req, res, next);

  marcarUtilizada = (req, res, next) => this.conId("marcarUtilizada", req, res, next);

  validarEntrada = async (req, res, next) => {
    try {
      const id = this.parsearId(req.params.id);
      const numero = this.parsearId(req.params.numero);
      const compra = await this.compraService.validarEntrada(id, numero, req.usuario);
      return res.status(200).json(compra);
    } catch (error) {
      return next(error);
    }
  };

  listarDelEvento = async (req, res, next) => {
    try {
      const eventoId = this.parsearId(req.params.id);
      const query = this.extraerYValidarQuery(req.query, comprasQueryValidation);
      const pagina = await this.compraService.listarDelEvento(eventoId, req.usuario, query);
      return res.status(200).json(pagina);
    } catch (error) {
      return next(error);
    }
  };

  async conId(metodo, req, res, next) {
    try {
      const id = this.parsearId(req.params.id);
      const compra = await this.compraService[metodo](id, req.usuario);
      return res.status(200).json(compra);
    } catch (error) {
      return next(error);
    }
  }
}
